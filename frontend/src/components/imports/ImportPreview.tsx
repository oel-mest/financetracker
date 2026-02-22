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
    // pre-select all non-duplicates
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
      <div className="flex items-center gap-4 mb-4 p-3 bg-zinc-800/40 rounded-lg text-xs">
        <span className="text-zinc-400">
          <span className="text-white font-medium">{rows.length}</span> rows parsed
        </span>
        {dupeCount > 0 && (
          <span className="text-yellow-400">
            <span className="font-medium">{dupeCount}</span> duplicates skipped
          </span>
        )}
        <span className="text-[#c8f65d]">
          <span className="font-medium">{selectedCount}</span> selected to import
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden mb-4">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs">
            <thead className="bg-zinc-800/60 sticky top-0">
              <tr>
                <th className="w-8 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedCount > 0 && selectedCount === rows.filter(r => !r.is_duplicate).length}
                    onChange={toggleAll}
                    className="accent-[#c8f65d]"
                  />
                </th>
                <th className="text-left px-3 py-2.5 text-zinc-400 font-medium">Date</th>
                <th className="text-left px-3 py-2.5 text-zinc-400 font-medium">Description</th>
                <th className="text-left px-3 py-2.5 text-zinc-400 font-medium">Merchant</th>
                <th className="text-left px-3 py-2.5 text-zinc-400 font-medium">Category</th>
                <th className="text-right px-3 py-2.5 text-zinc-400 font-medium">Amount</th>
                <th className="text-center px-3 py-2.5 text-zinc-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={`transition-colors ${
                    row.is_duplicate
                      ? 'opacity-40 bg-yellow-500/5'
                      : selected.has(i)
                      ? 'bg-[#c8f65d]/5'
                      : 'hover:bg-zinc-800/20'
                  }`}
                >
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      disabled={row.is_duplicate}
                      onChange={() => toggle(i)}
                      className="accent-[#c8f65d]"
                    />
                  </td>
                  <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{row.date}</td>
                  <td className="px-3 py-2 text-white max-w-[200px] truncate">{row.description}</td>
                  <td className="px-3 py-2 text-zinc-300">{row.merchant ?? '—'}</td>
                  <td className="px-3 py-2">
                    {row.category ? (
                      <Badge color={row.category.color ?? undefined}>
                        {row.category.icon} {row.category.name}
                      </Badge>
                    ) : '—'}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono whitespace-nowrap ${
                    row.type === 'debit' ? 'text-red-400' : 'text-[#c8f65d]'
                  }`}>
                    {row.type === 'debit' ? '−' : '+'}{row.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {row.is_duplicate
                      ? <Badge className="text-[10px] text-yellow-400 border-yellow-500/30 bg-yellow-500/10">Duplicate</Badge>
                      : <Badge className="text-[10px] text-[#c8f65d] border-[#c8f65d]/30 bg-[#c8f65d]/10">New</Badge>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleConfirm}
          disabled={loading || selectedCount === 0}
          className="flex-1 justify-center"
        >
          {loading ? 'Importing...' : `Import ${selectedCount} transaction${selectedCount !== 1 ? 's' : ''}`}
        </Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}