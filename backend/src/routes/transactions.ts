import { Router, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { buildTransactionHash } from '../lib/hash'
import { autoCategorize } from '../lib/autoCategorize'
import { AuthRequest } from '../types'

const router = Router()

const TransactionSchema = z.object({
  account_id:  z.string().uuid(),
  category_id: z.string().uuid().optional().nullable(),
  type:        z.enum(['debit', 'credit']),
  amount:      z.number().positive(),
  currency:    z.string().default('MAD'),
  description: z.string().min(1),
  merchant:    z.string().optional().nullable(),
  notes:       z.string().optional().nullable(),
  tags:        z.array(z.string()).default([]),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})

const UpdateTransactionSchema = TransactionSchema.partial().omit({ account_id: true })

const FilterSchema = z.object({
  account_id:   z.string().uuid().optional(),
  category_id:  z.string().uuid().optional(),
  type:         z.enum(['debit', 'credit']).optional(),
  merchant:     z.string().optional(),
  date_from:    z.string().optional(),
  date_to:      z.string().optional(),
  amount_min:   z.coerce.number().optional(),
  amount_max:   z.coerce.number().optional(),
  tags:         z.string().optional(),  // comma-separated
  search:       z.string().optional(),  // full-text on description/merchant
  page:         z.coerce.number().default(1),
  limit:        z.coerce.number().default(30).max(100),
})

// GET /transactions
router.get('/', async (req: AuthRequest, res: Response) => {
  const filters = FilterSchema.parse(req.query)
  const offset = (filters.page - 1) * filters.limit

  let query = supabase
    .from('transactions')
    .select('*, accounts(name, type), categories(name, color, icon)', { count: 'exact' })
    .eq('user_id', req.user!.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + filters.limit - 1)

  if (filters.account_id)  query = query.eq('account_id', filters.account_id)
  if (filters.category_id) query = query.eq('category_id', filters.category_id)
  if (filters.type)        query = query.eq('type', filters.type)
  if (filters.merchant)    query = query.ilike('merchant', `%${filters.merchant}%`)
  if (filters.date_from)   query = query.gte('date', filters.date_from)
  if (filters.date_to)     query = query.lte('date', filters.date_to)
  if (filters.amount_min)  query = query.gte('amount', filters.amount_min)
  if (filters.amount_max)  query = query.lte('amount', filters.amount_max)
  if (filters.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,merchant.ilike.%${filters.search}%`
    )
  }
  if (filters.tags) {
    const tagList = filters.tags.split(',').map((t) => t.trim())
    query = query.overlaps('tags', tagList)
  }

  const { data, error, count } = await query

  if (error) { res.status(500).json({ error: error.message }); return }

  res.json({
    data,
    pagination: {
      total: count ?? 0,
      page: filters.page,
      limit: filters.limit,
      pages: Math.ceil((count ?? 0) / filters.limit),
    },
  })
})

// GET /transactions/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, accounts(name, type), categories(name, color, icon)')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (error || !data) { res.status(404).json({ error: 'Transaction not found' }); return }
  res.json(data)
})

// POST /transactions
router.post('/', async (req: AuthRequest, res: Response) => {
  const body = TransactionSchema.parse(req.body)
  const userId = req.user!.id

  // Verify account belongs to user
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', body.account_id)
    .eq('user_id', userId)
    .single()

  if (!account) { res.status(400).json({ error: 'Account not found' }); return }

  // Auto-categorize if no category provided
  let categoryId = body.category_id
  if (!categoryId) {
    categoryId = await autoCategorize(userId, `${body.description} ${body.merchant ?? ''}`)
  }

  // Build hash for duplicate detection
  const hash = buildTransactionHash(userId, body.date, body.amount, body.description)

  // Check for duplicate
  const { data: duplicate } = await supabase
    .from('transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('hash', hash)
    .single()

  if (duplicate) {
    res.status(409).json({ error: 'Duplicate transaction detected', existing_id: duplicate.id })
    return
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...body, user_id: userId, category_id: categoryId, hash })
    .select('*, accounts(name, type), categories(name, color, icon)')
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

// PATCH /transactions/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const body = UpdateTransactionSchema.parse(req.body)
  const userId = req.user!.id

  const { data: existing } = await supabase
    .from('transactions')
    .select('id, date, amount, description')
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .single()

  if (!existing) { res.status(404).json({ error: 'Transaction not found' }); return }

  // Recompute hash if key fields changed
  const newDate        = body.date        ?? existing.date
  const newAmount      = body.amount      ?? existing.amount
  const newDescription = body.description ?? existing.description
  const hash = buildTransactionHash(userId, newDate, newAmount, newDescription)

  const { data, error } = await supabase
    .from('transactions')
    .update({ ...body, hash })
    .eq('id', req.params.id)
    .select('*, accounts(name, type), categories(name, color, icon)')
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// DELETE /transactions/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (!existing) { res.status(404).json({ error: 'Transaction not found' }); return }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', req.params.id)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(204).send()
})

export default router
