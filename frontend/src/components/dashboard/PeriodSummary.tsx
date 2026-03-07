import { Card } from '../ui/Card'
import { PeriodData } from '../../hooks/useDashboard'

interface Props { data: PeriodData }

function fmt(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtMonth(str: string) {
  return new Date(str).toLocaleDateString('fr-MA', { month: 'short', year: 'numeric' })
}

export function PeriodSummary({ data }: Props) {
  const cards = [
    {
      label: 'Avg monthly spend',
      value: fmt(data.avg_monthly_spend),
      suffix: 'MAD',
      sub: `${data.num_months} month${data.num_months > 1 ? 's' : ''} total: ${fmt(data.total_debit)} MAD`,
      color: '#f87171',
    },
    {
      label: 'Avg daily spend',
      value: fmt(data.avg_daily_spend),
      suffix: 'MAD',
      sub: `Over ${data.total_days} days`,
      color: '#f97316',
    },
    {
      label: 'Savings rate',
      value: `${data.savings_rate}`,
      suffix: '%',
      sub: data.savings_rate >= 0
        ? `Saved ${fmt(data.net)} MAD`
        : `Overspent ${fmt(Math.abs(data.net))} MAD`,
      color: data.savings_rate >= 0 ? 'var(--accent)' : '#f87171',
    },
    {
      label: 'Highest spending month',
      value: data.highest_month ? fmt(data.highest_month.debit) : '—',
      suffix: data.highest_month ? 'MAD' : '',
      sub: data.highest_month ? fmtMonth(data.highest_month.month) : 'No data',
      color: '#f87171',
    },
    {
      label: 'Lowest spending month',
      value: data.lowest_month ? fmt(data.lowest_month.debit) : '—',
      suffix: data.lowest_month ? 'MAD' : '',
      sub: data.lowest_month ? fmtMonth(data.lowest_month.month) : 'No data',
      color: 'var(--accent)',
    },
  ]

  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Period overview
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              {c.label}
            </p>
            <p className="text-xl font-bold" style={{ color: c.color }}>
              {c.value}
              <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>{c.suffix}</span>
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{c.sub}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
