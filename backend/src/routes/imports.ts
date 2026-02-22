import { Router, Response } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { supabase }          from '../lib/supabase'
import { parseCsv }          from '../lib/csvParser'
import { parsePdf }          from '../lib/pdfParser'
import { normalizeImport }   from '../lib/normalizeImport'
import { AuthRequest }       from '../types'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

// ─── CSV EXPORT ────────────────────────────────────────────────────────────────

// GET /imports/export?account_id=...&date_from=...&date_to=...
router.get('/export', async (req: AuthRequest, res: Response) => {
  const filters = z.object({
    account_id: z.string().uuid().optional(),
    date_from:  z.string().optional(),
    date_to:    z.string().optional(),
  }).parse(req.query)

  let query = supabase
    .from('transactions')
    .select('date, description, amount, type, merchant, notes, tags, categories(name)')
    .eq('user_id', req.user!.id)
    .order('date', { ascending: false })

  if (filters.account_id) query = query.eq('account_id', filters.account_id)
  if (filters.date_from)  query = query.gte('date', filters.date_from)
  if (filters.date_to)    query = query.lte('date', filters.date_to)

  const { data, error } = await query
  if (error) { res.status(500).json({ error: error.message }); return }

  const header = 'date,description,amount,type,merchant,notes,tags,category\n'
  const rows = (data ?? []).map((t) => {
    const cat = (t as any).categories?.name ?? ''
    return [
      t.date,
      csvEscape(t.description),
      t.amount,
      t.type,
      csvEscape(t.merchant ?? ''),
      csvEscape(t.notes    ?? ''),
      (t.tags ?? []).join('|'),
      csvEscape(cat),
    ].join(',')
  })

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="transactions-${Date.now()}.csv"`)
  res.send(header + rows.join('\n'))
})

// ─── CSV IMPORT ────────────────────────────────────────────────────────────────

// POST /imports/csv
router.post('/csv', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return }

  const { account_id } = z.object({
    account_id: z.string().uuid(),
  }).parse(req.body)

  // Verify account ownership
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', account_id)
    .eq('user_id', req.user!.id)
    .single()

  if (!account) { res.status(400).json({ error: 'Account not found' }); return }

  // Parse CSV
  let rawRows
  try {
    rawRows = parseCsv(req.file.buffer)
  } catch (e: any) {
    res.status(400).json({ error: `CSV parse error: ${e.message}` })
    return
  }

  if (rawRows.length === 0) {
    res.status(400).json({ error: 'No valid rows found in CSV' })
    return
  }

  // Normalize + dedupe + auto-categorize
  const normalized = await normalizeImport(req.user!.id, account_id, rawRows)

  // Create import session
  const { data: importSession, error: importError } = await supabase
    .from('imports')
    .insert({
      user_id:          req.user!.id,
      account_id,
      source:           'csv',
      status:           'parsed',
      raw_result:       normalized,
      transaction_count: normalized.length,
      duplicate_count:   normalized.filter((r) => r.is_duplicate).length,
    })
    .select()
    .single()

  if (importError) { res.status(500).json({ error: importError.message }); return }

  res.status(201).json({
    import_id:         importSession.id,
    preview:           normalized,
    transaction_count: normalized.length,
    duplicate_count:   normalized.filter((r) => r.is_duplicate).length,
    new_count:         normalized.filter((r) => !r.is_duplicate).length,
  })
})

// ─── PDF IMPORT ────────────────────────────────────────────────────────────────

// POST /imports/pdf  { account_id, storage_path }
router.post('/pdf', async (req: AuthRequest, res: Response) => {
  const { account_id, storage_path, year } = z.object({
    account_id:   z.string().uuid(),
    storage_path: z.string().min(1),
    year: z.number().int().min(2000).max(2100),
  }).parse(req.body)

  // Verify account ownership
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', account_id)
    .eq('user_id', req.user!.id)
    .single()

  if (!account) { res.status(400).json({ error: 'Account not found' }); return }

  // Create pending import session
  const { data: importSession, error: sessionError } = await supabase
    .from('imports')
    .insert({
      user_id:      req.user!.id,
      account_id,
      source:       'pdf_cih',
      status:       'pending',
      storage_path,
    })
    .select()
    .single()

  if (sessionError) { res.status(500).json({ error: sessionError.message }); return }

  // Call Python parser
  let parseResult
  try {
    parseResult = await parsePdf(storage_path, year)
  } catch (e: any) {
    await supabase
      .from('imports')
      .update({ status: 'failed', error_message: e.message })
      .eq('id', importSession.id)

    res.status(502).json({ error: `Parser error: ${e.message}` })
    return
  }

  // Normalize + dedupe + auto-categorize
  const normalized = await normalizeImport(
    req.user!.id,
    account_id,
    parseResult.transactions
  )

  // Update import session with results
  await supabase
    .from('imports')
    .update({
      status:            'parsed',
      raw_result:        normalized,
      transaction_count: normalized.length,
      duplicate_count:   normalized.filter((r) => r.is_duplicate).length,
    })
    .eq('id', importSession.id)

  res.status(201).json({
    import_id:          importSession.id,
    preview:            normalized,
    beginning_balance:  parseResult.beginning_balance,
    bank:               parseResult.bank,
    transaction_count:  normalized.length,
    duplicate_count:    normalized.filter((r) => r.is_duplicate).length,
    new_count:          normalized.filter((r) => !r.is_duplicate).length,
  })
})

// ─── CONFIRM IMPORT ────────────────────────────────────────────────────────────

// POST /imports/:id/confirm  { transactions: [...overrides] }
// User may edit category/notes/tags on preview before confirming
router.post('/:id/confirm', async (req: AuthRequest, res: Response) => {
  const { transactions } = z.object({
    transactions: z.array(z.object({
      date:        z.string(),
      description: z.string(),
      amount:      z.number().positive(),
      type:        z.enum(['debit', 'credit']),
      merchant:    z.string().nullable().optional(),
      notes:       z.string().nullable().optional(),
      tags:        z.array(z.string()).optional(),
      category_id: z.string().uuid().nullable().optional(),
      hash:        z.string(),
      is_duplicate: z.boolean(),
    })),
  }).parse(req.body)

  // Verify import session belongs to user
  const { data: session } = await supabase
    .from('imports')
    .select('id, account_id, status')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (!session) { res.status(404).json({ error: 'Import session not found' }); return }
  if (session.status === 'confirmed') {
    res.status(409).json({ error: 'Import already confirmed' })
    return
  }

  // Only insert non-duplicate rows (or duplicates the user explicitly kept)
  const toInsert = transactions
    .filter((t) => !t.is_duplicate)
    .map((t) => ({
      user_id:     req.user!.id,
      account_id:  session.account_id,
      date:        t.date,
      description: t.description,
      amount:      t.amount,
      type:        t.type,
      currency:    'MAD',
      merchant:    t.merchant   ?? null,
      notes:       t.notes      ?? null,
      tags:        t.tags       ?? [],
      category_id: t.category_id ?? null,
      hash:        t.hash,
    }))

  let inserted = 0
  let skipped  = 0

  if (toInsert.length > 0) {
    // Insert in batches of 50 to avoid request limits
    for (let i = 0; i < toInsert.length; i += 50) {
      const batch = toInsert.slice(i, i + 50)
      const { data, error } = await supabase
        .from('transactions')
        .insert(batch)
        .select('id')

      if (error) {
        // Unique constraint = duplicate slipped through, count as skipped
        if (error.code === '23505') {
          skipped += batch.length
        } else {
          res.status(500).json({ error: error.message })
          return
        }
      } else {
        inserted += data?.length ?? 0
      }
    }
  }

  // Mark import as confirmed
  await supabase
    .from('imports')
    .update({ status: 'confirmed' })
    .eq('id', req.params.id)

  res.json({
    message:   'Import confirmed',
    inserted,
    skipped,
    duplicates_ignored: transactions.filter((t) => t.is_duplicate).length,
  })
})

// ─── LIST IMPORTS ──────────────────────────────────────────────────────────────

// GET /imports
router.get('/', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('imports')
    .select('id, source, status, transaction_count, duplicate_count, created_at, storage_path')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export default router