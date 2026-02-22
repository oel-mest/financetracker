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
  selected?:   boolean
  onSelect?:   () => void
}

export function TransactionRow({ transaction: t, onEdit, onDelete, selected = false, onSelect }: TransactionRowProps) {
  const isDebit = t.type === 'debit'

  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group relative"
      style={{
        backgroundColor: selected ? 'var(--accent-muted)' : 'transparent',
        border: selected ? '1px solid var(--accent-border)' : '1px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {/* Hover-reveal checkbox */}
      <div
        className="flex-shrink-0 transition-opacity"
        style={{
          width: '16px',
          opacity: selected ? 1 : 0,
        }}
        onMouseEnter={(e) => {
          const parent = e.currentTarget.closest('.group') as HTMLElement
          if (parent) {
            const cb = e.currentTarget as HTMLElement
            cb.style.opacity = '1'
          }
        }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-4 h-4 rounded cursor-pointer"
          style={{ accentColor: 'var(--accent)' }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

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
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {t.merchant ?? t.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.date}</span>
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
        <p className={`text-sm font-semibold ${isDebit ? 'text-red-400' : ''}`} style={!isDebit ? { color: 'var(--accent)' } : {}}>
          {isDebit ? '−' : '+'}{t.amount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.accounts?.name}</p>
      </div>

      {/* Actions — visible on hover */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onEdit}
          className="text-xs px-2 py-1 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-xs px-2 py-1 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          Del
        </button>
      </div>
    </div>
  )
}