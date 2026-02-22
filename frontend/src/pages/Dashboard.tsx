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
          <h1 className="text-white font-bold text-2xl tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1 capitalize">{fmtMonthLabel(month)}</p>
        </div>
        {/* Month navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors flex items-center justify-center text-sm"
          >
            ‹
          </button>
          <button
            onClick={() => setMonthOffset(0)}
            disabled={monthOffset === 0}
            className="text-xs text-zinc-500 hover:text-[#c8f65d] transition-colors disabled:opacity-30 px-1"
          >
            Today
          </button>
          <button
            onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))}
            disabled={monthOffset === 0}
            className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors flex items-center justify-center text-sm disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-[#c8f65d] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Row 1: Summary cards */}
          <SummaryCards summary={data.summary} />

          {/* Row 2: Insights */}
          {insights.length > 0 && <InsightCards insights={insights} />}

          {/* Row 3: Trend + Category */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <TrendChart data={trend} />
            </div>
            <div className="lg:col-span-2">
              <CategoryChart data={data.category_breakdown} />
            </div>
          </div>

          {/* Row 4: Top merchants + Budgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopMerchants
              merchants={data.top_merchants}
              totalSpent={data.summary.total_debit}
            />
            <BudgetList budgets={data.budgets} />
          </div>

          {/* Row 5: Recent transactions */}
          <RecentTransactions transactions={data.recent_transactions} />
        </div>
      ) : null}
    </div>
  )
}