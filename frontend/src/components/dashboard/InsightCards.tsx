import { InsightCard } from '../../hooks/useDashboard'

interface Props { insights: InsightCard[] }

const SEVERITY_STYLES: Record<string, { border: string; bg: string; iconColor: string }> = {
  warning: { border: 'rgba(234,179,8,0.3)',  bg: 'rgba(234,179,8,0.06)',  iconColor: '#eab308' },
  info:    { border: 'var(--border)',         bg: 'var(--bg-hover)',       iconColor: 'var(--text-muted)' },
  success: { border: 'var(--accent-border)',  bg: 'var(--accent-muted)',   iconColor: 'var(--accent)' },
}

const SEVERITY_ICON = {
  warning: '⚠',
  info:    '◎',
  success: '✓',
}

export function InsightCards({ insights }: Props) {
  if (insights.length === 0) return null

  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Insights
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((insight, i) => {
          const s = SEVERITY_STYLES[insight.severity]
          return (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ border: `1px solid ${s.border}`, backgroundColor: s.bg }}
            >
              <div className="flex items-start gap-3">
                <span className="text-base flex-shrink-0" style={{ color: s.iconColor }}>
                  {SEVERITY_ICON[insight.severity]}
                </span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{insight.title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}