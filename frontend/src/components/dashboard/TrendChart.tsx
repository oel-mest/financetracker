import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { Card }       from '../ui/Card'
import { TrendPoint } from '../../hooks/useDashboard'

interface Props { data: TrendPoint[] }

function shortMonth(str: string) {
  const d = new Date(str)
  return d.toLocaleDateString('fr-MA', { month: 'short' })
}

export function TrendChart({ data }: Props) {
  const chartData = data.map((d) => ({
    month:  shortMonth(d.month),
    Spent:  Math.round(d.total_debit),
    Income: Math.round(d.total_credit),
  }))

  return (
    <Card className="p-5">
      <p className="text-xs font-mono uppercase tracking-wider mb-5" style={{ color: 'var(--text-muted)' }}>
        6-month trend
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f87171" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#c8f65d" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#c8f65d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
            labelStyle={{ color: 'var(--text-secondary)' }}
            itemStyle={{ color: 'var(--text-primary)' }}
            formatter={(v: number) => [`${v.toLocaleString('fr-MA')} MAD`]}
          />
          <Area type="monotone" dataKey="Spent"  stroke="#f87171" strokeWidth={2} fill="url(#gradSpent)"  dot={false} />
          <Area type="monotone" dataKey="Income" stroke="#c8f65d" strokeWidth={2} fill="url(#gradIncome)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-3 h-0.5 bg-red-400 inline-block rounded" /> Spent
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: 'var(--accent)' }} /> Income
        </span>
      </div>
    </Card>
  )
}