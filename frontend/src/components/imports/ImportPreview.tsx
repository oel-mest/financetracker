import { useState } from 'react'
import { api }     from '../../lib/api'
import { Button }  from '../ui/Button'
import { Badge }   from '../ui/Badge'

interface PreviewRow {
  date:         string
  description:  string
  amount:       number
  type:         'debit' | 'credit'
  merchant:     string | null
  category_id:  string | null
  is_duplicate: boolean
  category?:    { name: string; color: string | null; icon: string | null }
}

interface ImportPreviewProps {
  importId:    string
  rows:        PreviewRow[]
  onConfirmed: () => void
  onCancel:    () => void
}

export function ImportPreview({ importId, rows, onConfirmed, onCancel }: ImportPreviewProps) {
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [selected, setSelected] = useState<Set<number>>(
    new Set(rows.map((_, i) => i).filter((i) => !rows[i].is_duplicate))
  )

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const toggleAll = () => {
    const nonDupes = rows.map((_, i) => i).filter((i) => !rows[i].is_duplicate)
    if (selected.size === nonDupes.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(nonDupes))
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const transactions = [...selected].map((i) => rows[i])
      await api.post(`/imports/${importId}/confirm`, { transactions })
      onConfirmed()
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Confirm failed')
    } finally {
      setLoading(false)
    }
  }

  const dupeCount     = rows.filter((r) => r.is_duplicate).length
  const selectedCount = selected.size

  return (
    <div>
      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{rows.length}</span> rows parsed
        </span>
        {dupeCount > 0 && (
          <span style={{ color: '#f59e0b' }}>
            <span className="font-medium">{dupeCount}</span> duplicates skipped
          </span>
        )}
        <span style={{ color: 'var(--accent)' }}>
          <span className="font-medium">{selectedCount}</span> selected to import
        </span>
      </div>

      {error && (
        <div className="text-sm rounded-lg p-3 mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs">
            <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <tr>
                <th className="w-8 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedCount > 0 && selectedCount === rows.filter(r => !r.is_duplicate).length}
                    onChange={toggleAll}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                </th>
                {['Date', 'Description', 'Merchant', 'Category', 'Amount', 'Status'].map((h) => (
                  <th key={h} className={`px-3 py-2.5 font-medium ${h === 'Amount' ? 'text-right' : h === 'Status' ? 'text-center' : 'text-left'}`} style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="transition-colors"
                  style={{
                    borderTop: '1px solid var(--border)',
                    opacity: row.is_duplicate ? 0.4 : 1,
                    backgroundColor: row.is_duplicate
                      ? 'rgba(234,179,8,0.03)'
                      : selected.has(i)
                      ? 'var(--accent-muted)'
                      : 'transparent',
                  }}
                >
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      disabled={row.is_duplicate}
                      onChange={() => toggle(i)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{row.date}</td>
                  <td className="px-3 py-2 max-w-[200px] truncate" style={{ color: 'var(--text-primary)' }}>{row.description}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{row.merchant ?? '—'}</td>
                  <td className="px-3 py-2">
                    {row.category ? (
                      <Badge color={row.category.color ?? undefined}>
                        {row.category.icon} {row.category.name}
                      </Badge>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono whitespace-nowrap" style={{ color: row.type === 'debit' ? '#f87171' : 'var(--accent)' }}>
                    {row.type === 'debit' ? '−' : '+'}{row.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {row.is_duplicate
                      ? <Badge color="#f59e0b" className="text-[10px]">Duplicate</Badge>
                      : <Badge color="#16a34a" className="text-[10px]">New</Badge>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleConfirm} disabled={loading || selectedCount === 0} className="flex-1 justify-center">
          {loading ? 'Importing...' : `Import ${selectedCount} transaction${selectedCount !== 1 ? 's' : ''}`}
        </Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}