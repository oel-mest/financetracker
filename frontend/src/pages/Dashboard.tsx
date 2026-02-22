import { useState } from 'react'
import { useDashboard }         from '../hooks/useDashboard'
import { SummaryCards }         from '../components/dashboard/SummaryCards'
import { TrendChart }           from '../components/dashboard/TrendChart'
import { CategoryChart }        from '../components/dashboard/CategoryChart'
import { BudgetList }           from '../components/dashboard/BudgetList'
import { InsightCards }         from '../components/dashboard/InsightCards'
import { TopMerchants }         from '../components/dashboard/TopMerchants'
import { RecentTransactions }   from '../components/dashboard/RecentTransactions'

function getMonthStr(offset = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function fmtMonthLabel(str: string) {
  return new Date(str).toLocaleDateString('fr-MA', { month: 'long', year: 'numeric' })
}

export default function Dashboard() {
  const [monthOffset, setMonthOffset] = useState(0)
  const month = getMonthStr(monthOffset)
  const { data, trend, insights, loading, error } = useDashboard(month)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-sm mt-1 capitalize" style={{ color: 'var(--text-muted)' }}>{fmtMonthLabel(month)}</p>
        </div>
        {/* Month navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            ‹
          </button>
          <button
            onClick={() => setMonthOffset(0)}
            disabled={monthOffset === 0}
            className="text-xs px-1 transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Today
          </button>
          <button
            onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))}
            disabled={monthOffset === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors disabled:opacity-30"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            ›
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <SummaryCards summary={data.summary} />
          {insights.length > 0 && <InsightCards insights={insights} />}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3"><TrendChart data={trend} /></div>
            <div className="lg:col-span-2"><CategoryChart data={data.category_breakdown} /></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopMerchants merchants={data.top_merchants} totalSpent={data.summary.total_debit} />
            <BudgetList budgets={data.budgets} />
          </div>
          <RecentTransactions transactions={data.recent_transactions} />
        </div>
      ) : null}
    </div>
  )
}