import { Card }       from '../ui/Card'
import { BudgetItem } from '../../hooks/useDashboard'

interface Props { budgets: BudgetItem[] }

export function BudgetList({ budgets }: Props) {
  if (budgets.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Budgets</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No budgets set for this month.</p>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <p className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Budgets</p>
      <div className="space-y-4">
        {budgets.map((b) => {
          const color = b.over_budget ? '#f87171' : (b.categories?.color ?? 'var(--accent)')
          const pct   = Math.min(b.percentage, 100)
          return (
            <div key={b.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {b.categories?.icon} {b.categories?.name}
                </span>
                <span className="text-xs font-mono" style={{ color: b.over_budget ? '#f87171' : 'var(--text-secondary)' }}>
                  {b.total_spent.toLocaleString('fr-MA', { minimumFractionDigits: 0 })} /
                  {b.amount.toLocaleString('fr-MA', { minimumFractionDigits: 0 })} MAD
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              {b.over_budget && (
                <p className="text-xs mt-1" style={{ color: '#f87171' }}>
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