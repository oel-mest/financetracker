import { useState, useEffect } from 'react'
import { api }   from '../../lib/api'
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

const STATUS_COLOR: Record<string, string> = {
  confirmed: '#c8f65d',
  parsed:    '#60a5fa',
  failed:    '#f87171',
  pending:   '#94a3b8',
}

export function ImportHistory() {
  const [sessions, setSessions] = useState<ImportSession[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/imports')
      .then(({ data }: { data: ImportSession[] }) => setSessions(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No imports yet.</p>
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-4 px-4 py-3 rounded-lg"
          style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)' }}
        >
          <span className="text-lg">{s.source === 'pdf' ? '🏦' : '📄'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              {s.source.toUpperCase()} Import
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(s.created_at).toLocaleDateString('fr-MA', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          {s.transaction_count != null && (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {s.transaction_count} tx · {s.duplicate_count ?? 0} dupes
            </span>
          )}
          <Badge color={STATUS_COLOR[s.status]} className="text-[10px]">
            {s.status}
          </Badge>
        </div>
      ))}
    </div>
  )
}