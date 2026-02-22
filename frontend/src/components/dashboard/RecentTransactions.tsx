import { Link }  from 'react-router-dom'
import { Card }  from '../ui/Card'

interface Props { transactions: any[] }

export function RecentTransactions({ transactions }: Props) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Recent transactions</p>
        <Link to="/transactions" className="text-[#c8f65d] text-xs hover:underline">View all →</Link>
      </div>

      {transactions.length === 0 ? (
        <p className="text-zinc-600 text-sm">No transactions yet this month.</p>
      ) : (
        <div className="space-y-1">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2 hover:bg-zinc-800/30 rounded-lg px-2 transition-colors">
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
                <p className="text-white text-xs font-medium truncate">
                  {t.merchant ?? t.description}
                </p>
                <p className="text-zinc-600 text-xs">{t.date}</p>
              </div>
              <span className={`text-xs font-semibold flex-shrink-0 ${t.type === 'debit' ? 'text-red-400' : 'text-[#c8f65d]'}`}>
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