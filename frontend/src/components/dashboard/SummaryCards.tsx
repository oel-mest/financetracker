import { Card } from '../ui/Card'
import { DashboardSummary } from '../../hooks/useDashboard'

interface Props { summary: DashboardSummary }

function ChangePct({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const up = pct > 0
  return (
    <span className="text-xs font-mono" style={{ color: up ? '#f87171' : 'var(--accent)' }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}% vs last month
    </span>
  )
}

function fmt(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function SummaryCards({ summary }: Props) {
  const cards = [
    {
      label:  'Total spent',
      value:  summary.total_debit,
      change: summary.debit_change_pct,
      color:  '#f87171',
      sign:   '−',
    },
    {
      label:  'Total income',
      value:  summary.total_credit,
      change: summary.credit_change_pct,
      color:  'var(--accent)',
      sign:   '+',
    },
    {
      label:  'Net',
      value:  Math.abs(summary.net),
      change: null,
      color:  summary.net >= 0 ? 'var(--accent)' : '#f87171',
      sign:   summary.net >= 0 ? '+' : '−',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-5">
          <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
          <p className="text-2xl font-bold mb-1" style={{ color: c.color }}>
            {c.sign}{fmt(c.value)}
            <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>MAD</span>
          </p>
          <ChangePct pct={c.change} />
        </Card>
      ))}
    </div>
  )
}