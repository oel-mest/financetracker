import { Card } from '../ui/Card'
import { DashboardSummary } from '../../hooks/useDashboard'

interface Props { summary: DashboardSummary }

function ChangePct({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const up = pct > 0
  return (
    <span className={`text-xs font-mono ${up ? 'text-red-400' : 'text-[#c8f65d]'}`}>
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
      color:  'text-red-400',
      sign:   '−',
    },
    {
      label:  'Total income',
      value:  summary.total_credit,
      change: summary.credit_change_pct,
      color:  'text-[#c8f65d]',
      sign:   '+',
    },
    {
      label:  'Net',
      value:  Math.abs(summary.net),
      change: null,
      color:  summary.net >= 0 ? 'text-[#c8f65d]' : 'text-red-400',
      sign:   summary.net >= 0 ? '+' : '−',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-5">
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-3">{c.label}</p>
          <p className={`text-2xl font-bold ${c.color} mb-1`}>
            {c.sign}{fmt(c.value)}
            <span className="text-zinc-500 text-sm font-normal ml-1">MAD</span>
          </p>
          <ChangePct pct={c.change} />
        </Card>
      ))}
    </div>
  )
}