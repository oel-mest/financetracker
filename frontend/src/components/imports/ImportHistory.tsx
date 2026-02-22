import { useState, useEffect } from 'react'
import { api }   from '../../lib/api'
import { Card }  from '../ui/Card'
import { Badge } from '../ui/Badge'

interface ImportSession {
  id:                string
  source:            'csv' | 'pdf'
  status:            'pending' | 'parsed' | 'confirmed' | 'failed'
  transaction_count: number | null
  duplicate_count:   number | null
  created_at:        string
  storage_path:      string | null
}

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'text-[#c8f65d] border-[#c8f65d]/30 bg-[#c8f65d]/10',
  parsed:    'text-blue-400 border-blue-400/30 bg-blue-400/10',
  failed:    'text-red-400 border-red-400/30 bg-red-400/10',
  pending:   'text-zinc-400 border-zinc-600 bg-zinc-800',
}

export function ImportHistory() {
  const [sessions, setSessions] = useState<ImportSession[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/imports')
      .then(({ data }) => setSessions(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="w-5 h-5 border-2 border-[#c8f65d] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return <p className="text-zinc-600 text-sm text-center py-6">No imports yet.</p>
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-4 px-4 py-3 bg-zinc-800/30 border border-zinc-800 rounded-lg"
        >
          <span className="text-lg">{s.source === 'pdf' ? '🏦' : '📄'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium">
              {s.source.toUpperCase()} Import
            </p>
            <p className="text-zinc-500 text-xs">
              {new Date(s.created_at).toLocaleDateString('fr-MA', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          {s.transaction_count != null && (
            <span className="text-zinc-400 text-xs">
              {s.transaction_count} tx · {s.duplicate_count ?? 0} dupes
            </span>
          )}
          <Badge className={`text-[10px] ${STATUS_STYLE[s.status]}`}>
            {s.status}
          </Badge>
        </div>
      ))}
    </div>
  )
}