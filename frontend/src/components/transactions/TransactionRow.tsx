import { Badge } from '../ui/Badge'

export interface Transaction {
  id:          string
  date:        string
  description: string
  amount:      number
  type:        'debit' | 'credit'
  merchant:    string | null
  notes:       string | null
  tags:        string[]
  accounts:    { name: string; type: string } | null
  categories:  { name: string; color: string | null; icon: string | null } | null
}

interface TransactionRowProps {
  transaction: Transaction
  onEdit:      () => void
  onDelete:    () => void
}

export function TransactionRow({ transaction: t, onEdit, onDelete }: TransactionRowProps) {
  const isDebit = t.type === 'debit'

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/30 rounded-lg transition-colors group">
      {/* Category icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
        style={{
          backgroundColor: t.categories?.color ? `${t.categories.color}20` : '#3f3f4620',
          border: `1px solid ${t.categories?.color ?? '#3f3f46'}40`,
        }}
      >
        {t.categories?.icon ?? '📌'}
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {t.merchant ?? t.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-zinc-500 text-xs">{t.date}</span>
          {t.categories && (
            <Badge color={t.categories.color ?? undefined} className="text-[10px]">
              {t.categories.name}
            </Badge>
          )}
          {t.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} className="text-[10px]">{tag}</Badge>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-semibold ${isDebit ? 'text-red-400' : 'text-[#c8f65d]'}`}>
          {isDebit ? '−' : '+'}{t.amount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
        </p>
        <p className="text-zinc-600 text-xs">{t.accounts?.name}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onEdit}
          className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded hover:bg-zinc-700 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-zinc-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
        >
          Del
        </button>
      </div>
    </div>
  )
}