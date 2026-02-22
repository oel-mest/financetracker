import { Router, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { AuthRequest } from '../types'

const router = Router()

const BudgetSchema = z.object({
  category_id: z.string().uuid(),
  amount:      z.number().positive(),
  month:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Month must be YYYY-MM-01'),
  currency:    z.string().default('MAD'),
})

const UpdateBudgetSchema = BudgetSchema.partial().omit({ category_id: true, month: true })

// GET /budgets?month=2025-01-01
router.get('/', async (req: AuthRequest, res: Response) => {
  const { month } = z.object({
    month: z.string().optional(),
  }).parse(req.query)

  let query = supabase
    .from('budgets')
    .select('*, categories(name, color, icon)')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: true })

  if (month) query = query.eq('month', month)

  const { data: budgets, error } = await query
  if (error) { res.status(500).json({ error: error.message }); return }

  // For each budget, calculate how much was spent this month
  const enriched = await Promise.all(
    (budgets ?? []).map(async (budget) => {
      const { data: spent } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', req.user!.id)
        .eq('category_id', budget.category_id)
        .eq('type', 'debit')
        .gte('date', budget.month)
        .lt('date', nextMonth(budget.month))

      const total_spent = (spent ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
      const remaining   = Number(budget.amount) - total_spent
      const percentage  = Math.round((total_spent / Number(budget.amount)) * 100)

      return {
        ...budget,
        total_spent,
        remaining,
        percentage: Math.min(percentage, 100),
        over_budget: total_spent > Number(budget.amount),
      }
    })
  )

  res.json(enriched)
})

// POST /budgets
router.post('/', async (req: AuthRequest, res: Response) => {
  const body = BudgetSchema.parse(req.body)

  // Normalize month to first day
  const month = body.month.slice(0, 7) + '-01'

  const { data, error } = await supabase
    .from('budgets')
    .insert({ ...body, month, user_id: req.user!.id })
    .select('*, categories(name, color, icon)')
    .single()

  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Budget already exists for this category and month' })
      return
    }
    res.status(500).json({ error: error.message })
    return
  }

  res.status(201).json(data)
})

// PATCH /budgets/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const body = UpdateBudgetSchema.parse(req.body)

  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (!existing) { res.status(404).json({ error: 'Budget not found' }); return }

  const { data, error } = await supabase
    .from('budgets')
    .update(body)
    .eq('id', req.params.id)
    .select('*, categories(name, color, icon)')
    .single()

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// DELETE /budgets/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single()

  if (!existing) { res.status(404).json({ error: 'Budget not found' }); return }

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', req.params.id)

  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(204).send()
})

// Helper: get first day of next month
function nextMonth(monthStr: string): string {
  const d = new Date(monthStr)
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

export default router