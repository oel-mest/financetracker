import { Card }       from '../ui/Card'
import { BudgetItem } from '../../hooks/useDashboard'

interface Props { budgets: BudgetItem[] }

export function BudgetList({ budgets }: Props) {
  if (budgets.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">Budgets</p>
        <p className="text-zinc-600 text-sm">No budgets set for this month.</p>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-4">Budgets</p>
      <div className="space-y-4">
        {budgets.map((b) => {
          const color = b.over_budget ? '#f87171' : (b.categories?.color ?? '#c8f65d')
          const pct   = Math.min(b.percentage, 100)
          return (
            <div key={b.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white text-xs font-medium">
                  {b.categories?.icon} {b.categories?.name}
                </span>
                <span className={`text-xs font-mono ${b.over_budget ? 'text-red-400' : 'text-zinc-400'}`}>
                  {b.total_spent.toLocaleString('fr-MA', { minimumFractionDigits: 0 })} /
                  {b.amount.toLocaleString('fr-MA', { minimumFractionDigits: 0 })} MAD
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              {b.over_budget && (
                <p className="text-red-400 text-xs mt-1">
                  Over by {Math.abs(b.remaining).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}