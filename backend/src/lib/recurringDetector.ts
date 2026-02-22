import { supabase } from './supabase'

interface RecurringCandidate {
  merchant:        string
  frequency:       'weekly' | 'monthly' | 'yearly'
  average_amount:  number
  last_seen:       string
  transaction_count: number
  category_id:     string | null
}

/**
 * Analyzes the last 13 months of transactions for a user
 * and detects recurring/subscription patterns.
 * 
 * Logic:
 *  - Monthly: same merchant appears on roughly the same day each month (±5 days), 3+ times
 *  - Weekly:  same merchant appears every 7 days (±2 days), 4+ times
 *  - Yearly:  same merchant appears once a year, 2+ years
 */
export async function detectRecurring(userId: string): Promise<RecurringCandidate[]> {
  const since = new Date()
  since.setMonth(since.getMonth() - 13)

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('merchant, amount, date, category_id')
    .eq('user_id', userId)
    .eq('type', 'debit')
    .gte('date', since.toISOString().slice(0, 10))
    .not('merchant', 'is', null)
    .order('date', { ascending: true })

  if (error || !transactions) return []

  // Group by merchant
  const byMerchant: Record<string, { dates: Date[]; amounts: number[]; category_id: string | null }> = {}

  for (const t of transactions) {
    if (!t.merchant) continue
    const key = t.merchant.toUpperCase()
    if (!byMerchant[key]) {
      byMerchant[key] = { dates: [], amounts: [], category_id: t.category_id }
    }
    byMerchant[key].dates.push(new Date(t.date))
    byMerchant[key].amounts.push(Number(t.amount))
  }

  const results: RecurringCandidate[] = []

  for (const [merchant, data] of Object.entries(byMerchant)) {
    const { dates, amounts, category_id } = data
    if (dates.length < 2) continue

    const avg_amount = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const last_seen  = dates[dates.length - 1].toISOString().slice(0, 10)

    const frequency = detectFrequency(dates)
    if (!frequency) continue

    results.push({
      merchant,
      frequency,
      average_amount:    Math.round(avg_amount * 100) / 100,
      last_seen,
      transaction_count: dates.length,
      category_id,
    })
  }

  return results
}

/**
 * Saves detected recurring patterns to DB,
 * updating existing records or inserting new ones.
 */
export async function saveRecurringPatterns(
  userId: string,
  patterns: RecurringCandidate[]
): Promise<void> {
  for (const p of patterns) {
    await supabase
      .from('recurring_patterns')
      .upsert(
        {
          user_id:           userId,
          merchant:          p.merchant,
          frequency:         p.frequency,
          average_amount:    p.average_amount,
          last_seen:         p.last_seen,
          transaction_count: p.transaction_count,
          category_id:       p.category_id,
        },
        { onConflict: 'user_id,merchant,frequency' }
      )
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function detectFrequency(dates: Date[]): 'weekly' | 'monthly' | 'yearly' | null {
  if (dates.length < 2) return null

  const gaps = []
  for (let i = 1; i < dates.length; i++) {
    const diffDays = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
    gaps.push(diffDays)
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
  const maxDeviation = Math.max(...gaps.map((g) => Math.abs(g - avgGap)))

  // Weekly: avg gap ~7 days, deviation < 3 days, 4+ occurrences
  if (avgGap >= 5 && avgGap <= 9 && maxDeviation <= 3 && dates.length >= 4) {
    return 'weekly'
  }

  // Monthly: avg gap ~30 days, deviation < 7 days, 3+ occurrences
  if (avgGap >= 23 && avgGap <= 37 && maxDeviation <= 7 && dates.length >= 3) {
    return 'monthly'
  }

  // Yearly: avg gap ~365 days, deviation < 20 days, 2+ occurrences
  if (avgGap >= 345 && avgGap <= 385 && maxDeviation <= 20 && dates.length >= 2) {
    return 'yearly'
  }

  return null
}