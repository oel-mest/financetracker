import { Router, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { AuthRequest } from '../types'

const router = Router()

const CategorySchema = z.object({
  name:  z.string().min(1).max(100),
  icon:  z.string().optional(),
  color: z.string().optional(),
})

// GET /categories — returns default + user's own
router.get('/', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${req.user!.id}`)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// POST /categories — create custom category
router.post('/', async (req: AuthRequest, res: Response) => {
  const body = CategorySchema.parse(req.body)

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...body, user_id: req.user!.id, is_default: false })
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

// PATCH /categories/:id — only own, non-default
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const body = CategorySchema.partial().parse(req.body)

  const { data: existing } = await supabase
    .from('categories')
    .select('id, is_default')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (!existing) { res.status(404).json({ error: 'Category not found' }); return }
  if (existing.is_default) { res.status(403).json({ error: 'Cannot edit default categories' }); return }

  const { data, error } = await supabase
    .from('categories')
    .update(body)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// DELETE /categories/:id — only own, non-default
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { data: existing } = await supabase
    .from('categories')
    .select('id, is_default')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (!existing) { res.status(404).json({ error: 'Category not found' }); return }
  if (existing.is_default) { res.status(403).json({ error: 'Cannot delete default categories' }); return }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', req.params.id)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(204).send()
})

export default router
