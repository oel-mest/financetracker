import { Router, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { AuthRequest } from '../types'

const router = Router()

const MonthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

// GET /dashboard?month=2025-01-01
// Returns everything the dashboard needs in one request
router.get('/', async (req: AuthRequest, res: Response) => {
  const { month } = MonthSchema.parse(req.query)
  const userId = req.user!.id

  // Default to current month
  const now = new Date()
  const currentMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const prevMonth = getPrevMonth(currentMonth)
  const monthEnd  = nextMonth(currentMonth)

  // Run all queries in parallel
  const [
    monthlyCurrent,
    monthlyPrev,
    categoryBreakdown,
    topMerchants,
    budgets,
    recentTransactions,
    accountBalances,
  ] = await Promise.all([

    // Current month totals
    supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('date', currentMonth)
      .lt('date', monthEnd),

    // Previous month totals (for comparison)
    supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('date', prevMonth)
      .lt('date', currentMonth),

    // Category breakdown current month
    supabase
      .from('transactions')
      .select('amount, type, category_id, categories(name, color, icon)')
      .eq('user_id', userId)
      .eq('type', 'debit')
      .gte('date', currentMonth)
      .lt('date', monthEnd),

    // Top merchants current month
    supabase
      .from('transactions')
      .select('merchant, amount')
      .eq('user_id', userId)
      .eq('type', 'debit')
      .gte('date', currentMonth)
      .lt('date', monthEnd)
      .not('merchant', 'is', null),

    // Budgets with spent calculation
    supabase
      .from('budgets')
      .select('*, categories(name, color, icon)')
      .eq('user_id', userId)
      .eq('month', currentMonth),

    // Recent 5 transactions
    supabase
      .from('transactions')
      .select('*, accounts(name, type), categories(name, color, icon)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),

    // Account balances
    supabase
      .from('accounts')
      .select('id, name, type, balance, currency, color')
      .eq('user_id', userId),
  ])

  // --- Monthly totals ---
  const currentDebit  = sumByType(monthlyCurrent.data ?? [], 'debit')
  const currentCredit = sumByType(monthlyCurrent.data ?? [], 'credit')
  const prevDebit     = sumByType(monthlyPrev.data ?? [], 'debit')
  const prevCredit    = sumByType(monthlyPrev.data ?? [], 'credit')

  // --- Category breakdown ---
  const categoryMap: Record<string, {
    category_id: string | null
    name: string
    color: string | null
    icon: string | null
    total: number
    count: number
  }> = {}

  for (const t of categoryBreakdown.data ?? []) {
    const key = t.category_id ?? 'uncategorized'
    const cat = (t as any).categories
    if (!categoryMap[key]) {
      categoryMap[key] = {
        category_id: t.category_id,
        name:  cat?.name  ?? 'Uncategorized',
        color: cat?.color ?? '#6B7280',
        icon:  cat?.icon  ?? '📌',
        total: 0,
        count: 0,
      }
    }
    categoryMap[key].total += Number(t.amount)
    categoryMap[key].count += 1
  }
  const categories = Object.values(categoryMap).sort((a, b) => b.total - a.total)

  // --- Top merchants ---
  const merchantMap: Record<string, { merchant: string; total: number; count: number }> = {}
  for (const t of topMerchants.data ?? []) {
    if (!t.merchant) continue
    if (!merchantMap[t.merchant]) {
      merchantMap[t.merchant] = { merchant: t.merchant, total: 0, count: 0 }
    }
    merchantMap[t.merchant].total += Number(t.amount)
    merchantMap[t.merchant].count += 1
  }
  const merchants = Object.values(merchantMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // --- Budgets vs actual ---
  const budgetsEnriched = await Promise.all(
    (budgets.data ?? []).map(async (budget) => {
      const { data: spent } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category_id', budget.category_id)
        .eq('type', 'debit')
        .gte('date', currentMonth)
        .lt('date', monthEnd)

      const total_spent = (spent ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
      return {
        ...budget,
        total_spent,
        remaining: Number(budget.amount) - total_spent,
        percentage: Math.min(Math.round((total_spent / Number(budget.amount)) * 100), 100),
        over_budget: total_spent > Number(budget.amount),
      }
    })
  )

  res.json({
    month: currentMonth,
    summary: {
      total_debit:       currentDebit,
      total_credit:      currentCredit,
      net:               currentCredit - currentDebit,
      prev_total_debit:  prevDebit,
      prev_total_credit: prevCredit,
      debit_change_pct:  changePct(prevDebit, currentDebit),
      credit_change_pct: changePct(prevCredit, currentCredit),
    },
    category_breakdown: categories,
    top_merchants:      merchants,
    budgets:            budgetsEnriched,
    recent_transactions: recentTransactions.data ?? [],
    accounts:           accountBalances.data ?? [],
  })
})

// GET /dashboard/trend?months=6
// Returns monthly totals for the last N months (for trend chart)
router.get('/trend', async (req: AuthRequest, res: Response) => {
  const { months } = z.object({
    months: z.coerce.number().min(1).max(24).default(6),
  }).parse(req.query)

  const userId = req.user!.id
  const result = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const monthEnd   = nextMonth(monthStart)

    const { data } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lt('date', monthEnd)

    result.push({
      month:        monthStart,
      total_debit:  sumByType(data ?? [], 'debit'),
      total_credit: sumByType(data ?? [], 'credit'),
    })
  }

  res.json(result)
})

// GET /dashboard/oldest
// Returns the oldest transaction month for the user
router.get('/oldest', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id

  const { data } = await supabase
    .from('transactions')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .limit(1)

  if (!data || data.length === 0) {
    const now = new Date()
    res.json({ oldest_month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01` })
    return
  }

  const d = new Date(data[0].date)
  res.json({ oldest_month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` })
})

// GET /dashboard/period?from=2025-01-01&to=2025-06-01
// Returns aggregated stats for a multi-month range (max 12 months)
router.get('/period', async (req: AuthRequest, res: Response) => {
  const { from, to } = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(req.query)

  const userId = req.user!.id
  const rangeEnd = nextMonth(to)

  // Fetch all transactions in the range
  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount, date')
    .eq('user_id', userId)
    .gte('date', from)
    .lt('date', rangeEnd)

  const rows = transactions ?? []

  // Overall totals
  const totalDebit  = sumByType(rows, 'debit')
  const totalCredit = sumByType(rows, 'credit')

  // Per-month breakdown
  const monthlyMap: Record<string, { debit: number; credit: number }> = {}
  for (const t of rows) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    if (!monthlyMap[key]) monthlyMap[key] = { debit: 0, credit: 0 }
    monthlyMap[key][t.type as 'debit' | 'credit'] += Number(t.amount)
  }

  const months = Object.entries(monthlyMap)
    .map(([month, v]) => ({ month, debit: v.debit, credit: v.credit, net: v.credit - v.debit }))
    .sort((a, b) => a.month.localeCompare(b.month))

  const numMonths = months.length || 1

  // Days in range
  const fromDate = new Date(from)
  const toDate   = new Date(rangeEnd)
  const totalDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)))

  // Highest / lowest spending months
  const highestMonth = months.length > 0
    ? months.reduce((max, m) => m.debit > max.debit ? m : max, months[0])
    : null
  const lowestMonth = months.length > 0
    ? months.reduce((min, m) => m.debit < min.debit ? m : min, months[0])
    : null

  res.json({
    from,
    to,
    total_debit:       totalDebit,
    total_credit:      totalCredit,
    net:               totalCredit - totalDebit,
    avg_monthly_spend: Math.round((totalDebit / numMonths) * 100) / 100,
    avg_daily_spend:   Math.round((totalDebit / totalDays) * 100) / 100,
    savings_rate:      totalCredit > 0
      ? Math.round(((totalCredit - totalDebit) / totalCredit) * 10000) / 100
      : 0,
    num_months:        numMonths,
    total_days:        totalDays,
    highest_month:     highestMonth,
    lowest_month:      lowestMonth,
    months,
  })
})

// --- Helpers ---
function sumByType(rows: { type: string; amount: unknown }[], type: string): number {
  return rows
    .filter((r) => r.type === type)
    .reduce((sum, r) => sum + Number(r.amount), 0)
}

function changePct(prev: number, current: number): number | null {
  if (prev === 0) return null
  return Math.round(((current - prev) / prev) * 100)
}

function nextMonth(monthStr: string): string {
  const d = new Date(monthStr)
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

function getPrevMonth(monthStr: string): string {
  const d = new Date(monthStr)
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

export default router