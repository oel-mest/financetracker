import { Router, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { AuthRequest } from '../types'

const router = Router()

const RuleSchema = z.object({
  category_id: z.string().uuid(),
  keyword:     z.string().min(1).max(100),
  priority:    z.number().int().min(0).max(100).default(10),
})

const UpdateRuleSchema = RuleSchema.partial().omit({ category_id: true })

// GET /rules — returns default + user's own rules
router.get('/', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('categorization_rules')
    .select('*, categories(name, color, icon)')
    .or(`user_id.is.null,user_id.eq.${req.user!.id}`)
    .order('priority', { ascending: false })
    .order('keyword', { ascending: true })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// POST /rules — create custom rule
router.post('/', async (req: AuthRequest, res: Response) => {
  const body = RuleSchema.parse(req.body)

  // Verify category exists and is accessible
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('id', body.category_id)
    .or(`user_id.is.null,user_id.eq.${req.user!.id}`)
    .single()

  if (!category) { res.status(400).json({ error: 'Category not found' }); return }

  const { data, error } = await supabase
    .from('categorization_rules')
    .insert({ ...body, user_id: req.user!.id, is_default: false })
    .select('*, categories(name, color, icon)')
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

// PATCH /rules/:id — only own, non-default rules
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const body = UpdateRuleSchema.parse(req.body)

  const { data: existing } = await supabase
    .from('categorization_rules')
    .select('id, is_default')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (!existing) { res.status(404).json({ error: 'Rule not found' }); return }
  if (existing.is_default) { res.status(403).json({ error: 'Cannot edit default rules' }); return }

  const { data, error } = await supabase
    .from('categorization_rules')
    .update(body)
    .eq('id', req.params.id)
    .select('*, categories(name, color, icon)')
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// DELETE /rules/:id — only own, non-default rules
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { data: existing } = await supabase
    .from('categorization_rules')
    .select('id, is_default')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (!existing) { res.status(404).json({ error: 'Rule not found' }); return }
  if (existing.is_default) { res.status(403).json({ error: 'Cannot delete default rules' }); return }

  const { error } = await supabase
    .from('categorization_rules')
    .delete()
    .eq('id', req.params.id)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(204).send()
})

export default router