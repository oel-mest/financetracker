import { Card }        from '../ui/Card'
import { TopMerchant } from '../../hooks/useDashboard'

interface Props { merchants: TopMerchant[]; totalSpent: number }

export function TopMerchants({ merchants, totalSpent }: Props) {
  if (merchants.length === 0) return null

  return (
    <Card className="p-5">
      <p className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Top merchants</p>
      <div className="space-y-3">
        {merchants.map((m, i) => {
          const pct = totalSpent > 0 ? Math.round((m.total / totalSpent) * 100) : 0
          return (
            <div key={m.merchant} className="flex items-center gap-3">
              <span className="text-xs font-mono w-4" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.merchant}</span>
                  <span className="text-xs font-mono ml-2 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                    {m.total.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: 'var(--accent)', opacity: 0.6 }} />
                </div>
              </div>
              <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}