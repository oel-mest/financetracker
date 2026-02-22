import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export interface DashboardSummary {
  total_debit:       number
  total_credit:      number
  net:               number
  prev_total_debit:  number
  prev_total_credit: number
  debit_change_pct:  number | null
  credit_change_pct: number | null
}

export interface CategoryBreakdown {
  category_id:       string | null
  name:              string
  color:             string | null
  icon:              string | null
  total:             number
  count:             number
}

export interface TopMerchant {
  merchant:          string
  total_amount:      number
  transaction_count: number
}

export interface BudgetItem {
  id:           string
  category_id:  string
  amount:       number
  total_spent:  number
  remaining:    number
  percentage:   number
  over_budget:  boolean
  categories:   { name: string; color: string | null; icon: string | null }
}

export interface DashboardData {
  month:               string
  summary:             DashboardSummary
  category_breakdown:  CategoryBreakdown[]
  top_merchants:       TopMerchant[]
  budgets:             BudgetItem[]
  recent_transactions: any[]
  accounts:            any[]
}

export interface TrendPoint {
  month:        string
  total_debit:  number
  total_credit: number
}

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

export function useDashboard(month: string) {
  const [data,     setData]     = useState<DashboardData | null>(null)
  const [trend,    setTrend]    = useState<TrendPoint[]>([])
  const [insights, setInsights] = useState<InsightCard[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dashRes, trendRes, insightRes] = await Promise.all([
        api.get('/dashboard', { params: { month } }),
        api.get('/dashboard/trend', { params: { months: 6 } }),
        api.get('/insights', { params: { month } }),
      ])
      setData(dashRes.data)
      setTrend(trendRes.data)
      setInsights(insightRes.data)
    } catch {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetch() }, [fetch])

  return { data, trend, insights, loading, error, refetch: fetch }
}