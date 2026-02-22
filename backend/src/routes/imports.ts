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

// ── CSV EXPORT ────────────────────────────────────────────────────────────────

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

// ── CSV IMPORT ────────────────────────────────────────────────────────────────

router.post('/csv', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return }

  const { account_id } = z.object({
    account_id: z.string().uuid(),
  }).parse(req.body)

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', account_id)
    .eq('user_id', req.user!.id)
    .single()

  if (!account) { res.status(400).json({ error: 'Account not found' }); return }

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

  const normalized = await normalizeImport(req.user!.id, account_id, rawRows)

  const { data: importSession, error: importError } = await supabase
    .from('imports')
    .insert({
      user_id:           req.user!.id,
      account_id,
      source:            'csv',
      status:            'parsed',
      raw_result:        normalized,
      transaction_count: normalized.length,
      duplicate_count:   normalized.filter((r) => r.is_duplicate).length,
    })
    .select()
    .single()

  if (importError) { res.status(500).json({ error: importError.message }); return }

  res.status(201).json({
    import_id:         importSession.id,
    transactions:      normalized,
    transaction_count: normalized.length,
    duplicate_count:   normalized.filter((r) => r.is_duplicate).length,
  })
})

// ── PDF IMPORT ────────────────────────────────────────────────────────────────
// Frontend sends the PDF file directly — backend uploads to storage using service role key

router.post('/pdf', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return }

  const { account_id, year } = z.object({
    account_id: z.string().uuid(),
    year:       z.coerce.number().int().min(2000).max(2100),
  }).parse(req.body)

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', account_id)
    .eq('user_id', req.user!.id)
    .single()

  if (!account) { res.status(400).json({ error: 'Account not found' }); return }

  // Upload to Supabase Storage using service role key (bypasses RLS)
  const storagePath = `${req.user!.id}/${Date.now()}_statement.pdf`
  const { error: uploadError } = await supabase.storage
    .from('imports')
    .upload(storagePath, req.file.buffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    res.status(500).json({ error: `Storage upload failed: ${uploadError.message}` })
    return
  }

  // Create pending import session
  const { data: importSession, error: sessionError } = await supabase
    .from('imports')
    .insert({
      user_id:      req.user!.id,
      account_id,
      source:       'pdf',
      status:       'pending',
      storage_path: storagePath,
    })
    .select()
    .single()

  if (sessionError) { res.status(500).json({ error: sessionError.message }); return }

  // Call Python parser
  let parseResult
  try {
    parseResult = await parsePdf(storagePath, year)
  } catch (e: any) {
    await supabase
      .from('imports')
      .update({ status: 'failed' })
      .eq('id', importSession.id)
    res.status(502).json({ error: `Parser error: ${e.message}` })
    return
  }

  const normalized = await normalizeImport(req.user!.id, account_id, parseResult.transactions)

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
    import_id:         importSession.id,
    transactions:      normalized,
    transaction_count: normalized.length,
    duplicate_count:   normalized.filter((r) => r.is_duplicate).length,
  })
})

// ── CONFIRM IMPORT ────────────────────────────────────────────────────────────

router.post('/:id/confirm', async (req: AuthRequest, res: Response) => {
  const { transactions } = z.object({
    transactions: z.array(z.object({
      date:         z.string(),
      description:  z.string(),
      amount:       z.number().positive(),
      type:         z.enum(['debit', 'credit']),
      merchant:     z.string().nullable().optional(),
      notes:        z.string().nullable().optional(),
      tags:         z.array(z.string()).optional(),
      category_id:  z.string().uuid().nullable().optional(),
      hash:         z.string(),
      is_duplicate: z.boolean(),
    })),
  }).parse(req.body)

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
      merchant:    t.merchant    ?? null,
      notes:       t.notes       ?? null,
      tags:        t.tags        ?? [],
      category_id: t.category_id ?? null,
      hash:        t.hash,
    }))

  let inserted = 0
  let skipped  = 0

  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50)
    const { data, error } = await supabase
      .from('transactions')
      .insert(batch)
      .select('id')

    if (error) {
      if (error.code === '23505') { skipped += batch.length }
      else { res.status(500).json({ error: error.message }); return }
    } else {
      inserted += data?.length ?? 0
    }
  }

  await supabase
    .from('imports')
    .update({ status: 'confirmed' })
    .eq('id', req.params.id)

  res.json({ message: 'Import confirmed', inserted, skipped })
})

// ── LIST IMPORTS ──────────────────────────────────────────────────────────────

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

// ── HELPERS ───────────────────────────────────────────────────────────────────

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export default router