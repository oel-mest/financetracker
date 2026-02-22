import { Link }  from 'react-router-dom'
import { Card }  from '../ui/Card'

interface Props { transactions: any[] }

export function RecentTransactions({ transactions }: Props) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Recent transactions</p>
        <Link to="/transactions" className="text-xs hover:underline" style={{ color: 'var(--accent)' }}>View all →</Link>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No transactions yet this month.</p>
      ) : (
        <div className="space-y-1">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 py-2 rounded-lg px-2 transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{
                  backgroundColor: t.categories?.color ? `${t.categories.color}20` : '#3f3f4620',
                  border: `1px solid ${t.categories?.color ?? '#3f3f46'}40`,
                }}
              >
                {t.categories?.icon ?? '📌'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {t.merchant ?? t.description}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.date}</p>
              </div>
              <span className="text-xs font-semibold flex-shrink-0" style={{ color: t.type === 'debit' ? '#f87171' : 'var(--accent)' }}>
                {t.type === 'debit' ? '−' : '+'}
                {Number(t.amount).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}