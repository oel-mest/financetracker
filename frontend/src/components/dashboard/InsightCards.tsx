import { InsightCard } from '../../hooks/useDashboard'

interface Props { insights: InsightCard[] }

const SEVERITY_STYLES = {
  warning: 'border-yellow-500/30 bg-yellow-500/5',
  info:    'border-zinc-700 bg-zinc-800/30',
  success: 'border-[#c8f65d]/30 bg-[#c8f65d]/5',
}

const SEVERITY_ICON = {
  warning: '⚠',
  info:    '◎',
  success: '✓',
}

const SEVERITY_COLOR = {
  warning: 'text-yellow-400',
  info:    'text-zinc-400',
  success: 'text-[#c8f65d]',
}

export function InsightCards({ insights }: Props) {
  if (insights.length === 0) return null

  return (
    <div>
      <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">Insights</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`border rounded-xl p-4 ${SEVERITY_STYLES[insight.severity]}`}
          >
            <div className="flex items-start gap-3">
              <span className={`text-base flex-shrink-0 ${SEVERITY_COLOR[insight.severity]}`}>
                {SEVERITY_ICON[insight.severity]}
              </span>
              <div>
                <p className="text-white text-sm font-medium">{insight.title}</p>
                <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}