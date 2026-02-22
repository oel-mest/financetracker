import { Card }        from '../ui/Card'
import { TopMerchant } from '../../hooks/useDashboard'

interface Props { merchants: TopMerchant[]; totalSpent: number }

export function TopMerchants({ merchants, totalSpent }: Props) {
  if (merchants.length === 0) return null

  return (
    <Card className="p-5">
      <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-4">Top merchants</p>
      <div className="space-y-3">
        {merchants.map((m, i) => {
          const pct = totalSpent > 0 ? Math.round((m.total_amount / totalSpent) * 100) : 0
          return (
            <div key={m.merchant} className="flex items-center gap-3">
              <span className="text-zinc-600 text-xs font-mono w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-xs font-medium truncate">{m.merchant}</span>
                  <span className="text-zinc-400 text-xs font-mono ml-2 flex-shrink-0">
                    {m.total_amount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                  </span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#c8f65d]/60 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="text-zinc-600 text-xs w-8 text-right">{pct}%</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}