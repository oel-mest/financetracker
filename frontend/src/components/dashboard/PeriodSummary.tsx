import { Card } from '../ui/Card'
import { PeriodData } from '../../hooks/useDashboard'

interface Props { data: PeriodData }

function fmt(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtMonth(str: string) {
  const [year, month] = str.split('-')
  const d = new Date(Number(year), Number(month) - 1, 15)
  return d.toLocaleDateString('fr-MA', { month: 'short', year: 'numeric' })
}

export function PeriodSummary({ data }: Props) {
  return (
    <div className="space-y-4">
      {/* Top row: Total Spent / Total Income / Net */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Total spent
          </p>
          <p className="text-2xl font-bold" style={{ color: '#f87171' }}>
            -{fmt(data.total_debit)}
            <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>MAD</span>
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Over {data.num_months} month{data.num_months > 1 ? 's' : ''}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Total income
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            +{fmt(data.total_credit)}
            <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>MAD</span>
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Over {data.num_months} month{data.num_months > 1 ? 's' : ''}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Net
          </p>
          <p className="text-2xl font-bold" style={{ color: data.net >= 0 ? 'var(--accent)' : '#f87171' }}>
            {data.net >= 0 ? '+' : '-'}{fmt(Math.abs(data.net))}
            <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>MAD</span>
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Savings rate: {data.savings_rate}%
          </p>
        </Card>
      </div>

      {/* Bottom row: Averages + Extremes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Avg / month
          </p>
          <p className="text-lg font-bold" style={{ color: '#f87171' }}>
            {fmt(data.avg_monthly_spend)}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>MAD</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Avg / day
          </p>
          <p className="text-lg font-bold" style={{ color: '#f97316' }}>
            {fmt(data.avg_daily_spend)}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>MAD</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Highest month
          </p>
          <p className="text-lg font-bold" style={{ color: '#f87171' }}>
            {data.highest_month ? fmt(data.highest_month.debit) : '-'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {data.highest_month ? fmtMonth(data.highest_month.month) : 'No data'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Lowest month
          </p>
          <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
            {data.lowest_month ? fmt(data.lowest_month.debit) : '-'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {data.lowest_month ? fmtMonth(data.lowest_month.month) : 'No data'}
          </p>
        </Card>
      </div>

      {/* Monthly breakdown table */}
      {data.months.length > 1 && (
        <Card className="p-5">
          <p className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
            Month-by-month breakdown
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-2 pr-4 font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Month</th>
                  <th className="text-right py-2 px-4 font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Spent</th>
                  <th className="text-right py-2 px-4 font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Income</th>
                  <th className="text-right py-2 pl-4 font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((m) => (
                  <tr key={m.month} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2.5 pr-4 capitalize" style={{ color: 'var(--text-primary)' }}>
                      {fmtMonth(m.month)}
                    </td>
                    <td className="text-right py-2.5 px-4 font-mono" style={{ color: '#f87171' }}>
                      -{fmt(m.debit)}
                    </td>
                    <td className="text-right py-2.5 px-4 font-mono" style={{ color: 'var(--accent)' }}>
                      +{fmt(m.credit)}
                    </td>
                    <td className="text-right py-2.5 pl-4 font-mono font-medium" style={{ color: m.net >= 0 ? 'var(--accent)' : '#f87171' }}>
                      {m.net >= 0 ? '+' : '-'}{fmt(Math.abs(m.net))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
