import { Router, Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../types'
import { generateInsights } from '../lib/insightEngine'
import { detectRecurring, saveRecurringPatterns } from '../lib/recurringDetector'
import { supabase } from '../lib/supabase'

const router = Router()

// GET /insights?month=2025-05-01
// Returns insight cards for the given month
router.get('/', async (req: AuthRequest, res: Response) => {
  const { month } = z.object({
    month: z.string().optional(),
  }).parse(req.query)

  const now = new Date()
  const currentMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const insights = await generateInsights(req.user!.id, currentMonth)
  res.json(insights)
})

// POST /insights/detect-recurring
// Runs recurring detection and saves results to DB
router.post('/detect-recurring', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id

  const patterns = await detectRecurring(userId)
  await saveRecurringPatterns(userId, patterns)

  res.json({
    message:       'Recurring detection complete',
    patterns_found: patterns.length,
    patterns,
  })
})

// GET /insights/recurring
// Returns saved recurring patterns for the user
router.get('/recurring', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('recurring_patterns')
    .select('*, categories(name, color, icon)')
    .eq('user_id', req.user!.id)
    .order('transaction_count', { ascending: false })

  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

export default router