import { useState, useMemo } from 'react'
import { useDashboard, useOldestMonth, usePeriod } from '../hooks/useDashboard'
import { SummaryCards }         from '../components/dashboard/SummaryCards'
import { TrendChart }           from '../components/dashboard/TrendChart'
import { CategoryChart }        from '../components/dashboard/CategoryChart'
import { BudgetList }           from '../components/dashboard/BudgetList'
import { InsightCards }         from '../components/dashboard/InsightCards'
import { TopMerchants }         from '../components/dashboard/TopMerchants'
import { RecentTransactions }   from '../components/dashboard/RecentTransactions'
import { PeriodSummary }        from '../components/dashboard/PeriodSummary'

function getMonthStr(offset = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function fmtMonthLabel(str: string) {
  return new Date(str).toLocaleDateString('fr-MA', { month: 'long', year: 'numeric' })
}

function generateMonthOptions(oldest: string): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  const current = new Date(now.getFullYear(), now.getMonth(), 1)
  const [oy, om] = oldest.split('-').map(Number)
  const oldestDate = new Date(oy, om - 1, 1)

  const d = new Date(current)
  while (d >= oldestDate) {
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const label = d.toLocaleDateString('fr-MA', { month: 'long', year: 'numeric' })
    options.push({ value, label })
    d.setMonth(d.getMonth() - 1)
  }
  return options
}

type ViewMode = 'month' | 'period'

const PRESETS = [
  { label: 'Last 3 months', months: 3 },
  { label: 'Last 6 months', months: 6 },
  { label: 'YTD',           months: 0 },
  { label: 'Last 12 months', months: 12 },
]

function getPresetRange(months: number): { from: string; to: string } {
  const now = new Date()
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  if (months === 0) {
    // YTD: from January of current year
    return { from: `${now.getFullYear()}-01-01`, to }
  }

  const d = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
  const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  return { from, to }
}

export default function Dashboard() {
  const [viewMode, setViewMode]       = useState<ViewMode>('month')
  const [monthOffset, setMonthOffset] = useState(0)
  const [periodFrom, setPeriodFrom]   = useState<string>(() => getPresetRange(3).from)
  const [periodTo, setPeriodTo]       = useState<string>(() => getPresetRange(3).to)

  const month = getMonthStr(monthOffset)
  const oldest = useOldestMonth()
  const { data, trend, insights, loading, error } = useDashboard(month)
  const { data: periodData, loading: periodLoading, error: periodError } = usePeriod(
    viewMode === 'period' ? periodFrom : null,
    viewMode === 'period' ? periodTo : null,
  )

  const monthOptions = useMemo(() => {
    if (!oldest) return []
    return generateMonthOptions(oldest)
  }, [oldest])

  // Validate period range: max 12 months
  const periodMonthCount = useMemo(() => {
    const from = new Date(periodFrom)
    const to = new Date(periodTo)
    return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1
  }, [periodFrom, periodTo])

  const periodRangeError = periodMonthCount > 12
    ? 'Max range is 12 months'
    : periodFrom > periodTo
      ? 'Start must be before end'
      : null

  function handlePreset(months: number) {
    const range = getPresetRange(months)
    // Clamp to oldest month if needed
    if (oldest && range.from < oldest) {
      range.from = oldest
    }
    setPeriodFrom(range.from)
    setPeriodTo(range.to)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bold text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          {viewMode === 'month' && (
            <p className="text-sm mt-1 capitalize" style={{ color: 'var(--text-muted)' }}>{fmtMonthLabel(month)}</p>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div
            className="flex rounded-lg overflow-hidden text-xs"
            style={{ border: '1px solid var(--border)' }}
          >
            {(['month', 'period'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-3 py-1.5 capitalize transition-colors"
                style={{
                  backgroundColor: viewMode === mode ? 'var(--accent)' : 'var(--bg-card)',
                  color: viewMode === mode ? 'var(--bg-primary)' : 'var(--text-secondary)',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Month navigator */}
      {viewMode === 'month' && (
        <div className="flex items-center gap-2 mb-6">
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
      )}

      {/* Period range selector */}
      {viewMode === 'period' && (
        <div className="mb-6 space-y-3">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p.months)}
                className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* From / To dropdowns */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>From</span>
              <select
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>To</span>
              <select
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {periodRangeError && (
              <span className="text-xs" style={{ color: '#f87171' }}>{periodRangeError}</span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
          {error}
        </div>
      )}
      {periodError && viewMode === 'period' && (
        <div className="text-sm rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
          {periodError}
        </div>
      )}

      {/* Month view */}
      {viewMode === 'month' && (
        loading ? (
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
        ) : null
      )}

      {/* Period view */}
      {viewMode === 'period' && !periodRangeError && (
        periodLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : periodData ? (
          <div className="space-y-6">
            <PeriodSummary data={periodData} />
          </div>
        ) : null
      )}
    </div>
  )
}
