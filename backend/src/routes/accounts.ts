import { Router, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { AuthRequest } from '../types'

const router = Router()

const AccountSchema = z.object({
  name:     z.string().min(1).max(100),
  type:     z.enum(['cash', 'card', 'cih']),
  currency: z.string().default('MAD'),
  balance:  z.number().default(0),
  color:    z.string().optional(),
})

const UpdateAccountSchema = AccountSchema.partial()

// GET /accounts
router.get('/', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: true })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// GET /accounts/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (error || !data) { res.status(404).json({ error: 'Account not found' }); return }
  res.json(data)
})

// POST /accounts
router.post('/', async (req: AuthRequest, res: Response) => {
  const body = AccountSchema.parse(req.body)

  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...body, user_id: req.user!.id })
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

// PATCH /accounts/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const body = UpdateAccountSchema.parse(req.body)

  // Verify ownership
  const { data: existing } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (!existing) { res.status(404).json({ error: 'Account not found' }); return }

  const { data, error } = await supabase
    .from('accounts')
    .update(body)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// DELETE /accounts/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { data: existing } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (!existing) { res.status(404).json({ error: 'Account not found' }); return }

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', req.params.id)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(204).send()
})

export default router
