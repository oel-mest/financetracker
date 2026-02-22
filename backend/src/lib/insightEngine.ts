import { supabase } from './supabase'

export interface InsightCard {
  type:        string
  title:       string
  description: string
  amount?:     number
  change_pct?: number
  merchant?:   string
  category?:   string
  severity:    'info' | 'warning' | 'success'
}

/**
 * Generates insight cards by comparing current month vs previous month.
 * Returns up to 6 most relevant insights.
 */
export async function generateInsights(
  userId: string,
  currentMonth: string  // YYYY-MM-01
): Promise<InsightCard[]> {
  const prevMonth = getPrevMonth(currentMonth)
  const monthEnd  = getNextMonth(currentMonth)
  const prevEnd   = currentMonth

  const insights: InsightCard[] = []

  // Run all queries in parallel
  const [currentTx, prevTx, budgets, recurringPatterns] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type, category_id, merchant, date, categories(name)')
      .eq('user_id', userId)
      .gte('date', currentMonth)
      .lt('date', monthEnd),

    supabase
      .from('transactions')
      .select('amount, type, category_id, merchant, categories(name)')
      .eq('user_id', userId)
      .gte('date', prevMonth)
      .lt('date', prevEnd),

    supabase
      .from('budgets')
      .select('amount, category_id, categories(name)')
      .eq('user_id', userId)
      .eq('month', currentMonth),

    supabase
      .from('recurring_patterns')
      .select('merchant, frequency, last_seen, average_amount')
      .eq('user_id', userId),
  ])

  const cur  = currentTx.data ?? []
  const prev = prevTx.data    ?? []

  // ── 1. Overall spending spike ─────────────────────────────────
  const curTotal  = sumDebits(cur)
  const prevTotal = sumDebits(prev)
  if (prevTotal > 0) {
    const pct = Math.round(((curTotal - prevTotal) / prevTotal) * 100)
    if (pct >= 20) {
      insights.push({
        type:        'spending_spike',
        title:       'Spending spike this month',
        description: `You spent ${pct}% more than last month (${fmt(curTotal)} vs ${fmt(prevTotal)} MAD)`,
        amount:      curTotal,
        change_pct:  pct,
        severity:    pct >= 50 ? 'warning' : 'info',
      })
    } else if (pct <= -15) {
      insights.push({
        type:        'spending_down',
        title:       'Great job saving this month!',
        description: `You spent ${Math.abs(pct)}% less than last month (${fmt(curTotal)} vs ${fmt(prevTotal)} MAD)`,
        amount:      curTotal,
        change_pct:  pct,
        severity:    'success',
      })
    }
  }

  // ── 2. Biggest category increase ─────────────────────────────
  const curByCat  = groupByCategory(cur)
  const prevByCat = groupByCategory(prev)
  let biggestIncrease = { category: '', pct: 0, amount: 0 }

  for (const [catId, data] of Object.entries(curByCat)) {
    const prevAmt = prevByCat[catId]?.total ?? 0
    if (prevAmt === 0) continue
    const pct = Math.round(((data.total - prevAmt) / prevAmt) * 100)
    if (pct > biggestIncrease.pct) {
      biggestIncrease = { category: data.name, pct, amount: data.total }
    }
  }
  if (biggestIncrease.pct >= 30) {
    insights.push({
      type:        'category_spike',
      title:       `${biggestIncrease.category} spending up ${biggestIncrease.pct}%`,
      description: `You spent ${fmt(biggestIncrease.amount)} MAD on ${biggestIncrease.category} this month`,
      amount:      biggestIncrease.amount,
      change_pct:  biggestIncrease.pct,
      category:    biggestIncrease.category,
      severity:    'warning',
    })
  }

  // ── 3. New merchants this month ───────────────────────────────
  const prevMerchants = new Set(
    prev.filter((t) => t.merchant).map((t) => t.merchant!.toUpperCase())
  )
  const newMerchants = [
    ...new Set(
      cur
        .filter((t) => t.merchant && !prevMerchants.has(t.merchant.toUpperCase()))
        .map((t) => t.merchant!)
    ),
  ].slice(0, 3)

  if (newMerchants.length > 0) {
    insights.push({
      type:        'new_merchants',
      title:       `${newMerchants.length} new merchant${newMerchants.length > 1 ? 's' : ''} this month`,
      description: `First time spending at: ${newMerchants.join(', ')}`,
      severity:    'info',
    })
  }

  // ── 4. Budget alerts ─────────────────────────────────────────
  for (const budget of budgets.data ?? []) {
    const spent = cur
      .filter((t) => t.category_id === budget.category_id && t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const pct = Math.round((spent / Number(budget.amount)) * 100)
    const catName = (budget as any).categories?.name ?? 'Unknown'

    if (pct >= 100) {
      insights.push({
        type:        'budget_exceeded',
        title:       `${catName} budget exceeded`,
        description: `You've spent ${fmt(spent)} MAD — ${pct - 100}% over your ${fmt(Number(budget.amount))} MAD budget`,
        amount:      spent,
        change_pct:  pct,
        category:    catName,
        severity:    'warning',
      })
    } else if (pct >= 80) {
      insights.push({
        type:        'budget_warning',
        title:       `${catName} budget at ${pct}%`,
        description: `You've used ${fmt(spent)} of your ${fmt(Number(budget.amount))} MAD budget`,
        amount:      spent,
        change_pct:  pct,
        category:    catName,
        severity:    'warning',
      })
    }
  }

  // ── 5. Recurring payment due soon ────────────────────────────
  const today = new Date()
  for (const pattern of recurringPatterns.data ?? []) {
    if (!pattern.last_seen) continue
    const last = new Date(pattern.last_seen)
    const daysSinceLast = (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)

    const expectedGap = pattern.frequency === 'monthly' ? 30
      : pattern.frequency === 'weekly' ? 7
      : 365

    const daysUntilDue = expectedGap - daysSinceLast

    if (daysUntilDue >= 0 && daysUntilDue <= 5) {
      insights.push({
        type:        'recurring_due',
        title:       `${pattern.merchant} payment due soon`,
        description: `Expected ${pattern.frequency} charge of ~${fmt(pattern.average_amount)} MAD in ${Math.round(daysUntilDue)} day(s)`,
        amount:      pattern.average_amount,
        merchant:    pattern.merchant,
        severity:    'info',
      })
    }
  }

  // ── 6. No activity insight ────────────────────────────────────
  if (cur.length === 0) {
    insights.push({
      type:        'no_activity',
      title:       'No transactions yet this month',
      description: 'Start tracking your expenses by adding transactions or importing a statement',
      severity:    'info',
    })
  }

  // Return top 6, prioritizing warnings first
  return insights
    .sort((a, b) => {
      const order = { warning: 0, info: 1, success: 2 }
      return order[a.severity] - order[b.severity]
    })
    .slice(0, 6)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sumDebits(rows: any[]): number {
  return rows
    .filter((r) => r.type === 'debit')
    .reduce((sum, r) => sum + Number(r.amount), 0)
}

function groupByCategory(rows: any[]): Record<string, { total: number; name: string }> {
  const map: Record<string, { total: number; name: string }> = {}
  for (const r of rows) {
    if (r.type !== 'debit' || !r.category_id) continue
    if (!map[r.category_id]) {
      map[r.category_id] = { total: 0, name: r.categories?.name ?? 'Unknown' }
    }
    map[r.category_id].total += Number(r.amount)
  }
  return map
}

function fmt(n: number): string {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getPrevMonth(monthStr: string): string {
  const d = new Date(monthStr)
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

function getNextMonth(monthStr: string): string {
  const d = new Date(monthStr)
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}