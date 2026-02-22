import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card }              from '../ui/Card'
import { CategoryBreakdown } from '../../hooks/useDashboard'

interface Props { data: CategoryBreakdown[] }

const FALLBACK_COLORS = [
  '#c8f65d','#60a5fa','#f97316','#a78bfa',
  '#34d399','#fb7185','#fbbf24','#94a3b8',
]

export function CategoryChart({ data }: Props) {
  const top = data.slice(0, 7)
  const total = top.reduce((s, d) => s + d.total, 0)

  if (top.length === 0) {
    return (
      <Card className="p-5 flex items-center justify-center h-64">
        <p className="text-zinc-600 text-sm">No spending data yet</p>
      </Card>
    )
  }

  const chartData = top.map((d, i) => ({
    name:  d.name,
    value: Math.round(d.total),
    color: d.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    icon:  d.icon ?? '📌',
  }))

  return (
    <Card className="p-5">
      <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-4">
        Category breakdown
      </p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={64}
              dataKey="value"
              strokeWidth={2}
              stroke="#0a0a0f"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
              formatter={(v: number) => [`${v.toLocaleString('fr-MA')} MAD`]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-2 min-w-0">
          {chartData.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-zinc-400 text-xs truncate flex-1">{d.icon} {d.name}</span>
              <span className="text-white text-xs font-mono flex-shrink-0">
                {total > 0 ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}