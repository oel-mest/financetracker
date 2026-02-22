import { useState, useEffect, useCallback } from 'react'
import { api }        from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Button }     from '../components/ui/Button'
import { Card }       from '../components/ui/Card'
import { Badge }      from '../components/ui/Badge'
import { Modal }      from '../components/ui/Modal'
import { RuleForm }   from '../components/rules/RuleForm'

interface Rule {
  id:          string
  keyword:     string
  category_id: string
  priority:    number
  match_field: 'description' | 'merchant'
  is_default:  boolean
  categories:  { name: string; color: string | null; icon: string | null }
}

export default function Rules() {
  const [rules,       setRules]       = useState<Rule[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showCreate,  setShowCreate]  = useState(false)
  const [editing,     setEditing]     = useState<Rule | null>(null)
  const [deleting,    setDeleting]    = useState<Rule | null>(null)
  const [showDefault, setShowDefault] = useState(false)
  const [applying,    setApplying]    = useState(false)
  const [applyResult, setApplyResult] = useState<{ updated: number; skipped: number } | null>(null)

  const fetchRules = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/rules')
      setRules(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRules() }, [fetchRules])

  const handleCreate = async (payload: any) => {
    await api.post('/rules', payload)
    setShowCreate(false)
    fetchRules()
  }

  const handleUpdate = async (payload: any) => {
    await api.patch(`/rules/${editing!.id}`, payload)
    setEditing(null)
    fetchRules()
  }

  const handleDelete = async () => {
    await api.delete(`/rules/${deleting!.id}`)
    setDeleting(null)
    fetchRules()
  }

  const handleApply = async () => {
    setApplying(true)
    setApplyResult(null)
    try {
      const { data } = await api.post('/rules/apply')
      setApplyResult(data)
    } finally {
      setApplying(false)
    }
  }

  const userRules    = rules.filter((r) => !r.is_default)
  const defaultRules = rules.filter((r) =>  r.is_default)

  return (
    <div>
      <PageHeader
        title="Categorization Rules"
        subtitle="Keywords that auto-assign categories to transactions"
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleApply}
              disabled={applying}
            >
              {applying ? 'Applying...' : '⚡ Apply to existing'}
            </Button>
            <Button onClick={() => setShowCreate(true)}>+ New rule</Button>
          </div>
        }
      />

      {/* Apply result banner */}
      {applyResult && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl mb-6 text-sm"
          style={{ backgroundColor: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}
        >
          <span style={{ color: 'var(--accent)' }}>
            ✓ Updated <strong>{applyResult.updated}</strong> transactions · <strong>{applyResult.skipped}</strong> skipped
          </span>
          <button
            onClick={() => setApplyResult(null)}
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* User rules */}
          <div>
            <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Your rules ({userRules.length})
            </p>
            {userRules.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>No custom rules yet.</p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  Create rules to automatically categorize transactions by keyword.
                </p>
                <Button onClick={() => setShowCreate(true)}>+ New rule</Button>
              </Card>
            ) : (
              <Card>
                {userRules.map((rule, i) => (
                  <div key={rule.id} style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}>
                    <RuleRow rule={rule} onEdit={() => setEditing(rule)} onDelete={() => setDeleting(rule)} />
                  </div>
                ))}
              </Card>
            )}
          </div>

          {/* Default rules */}
          <div>
            <button
              onClick={() => setShowDefault((v) => !v)}
              className="text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2 mb-3"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <span>{showDefault ? '▾' : '▸'}</span>
              Default rules ({defaultRules.length}) — read only
            </button>

            {showDefault && (
              <Card>
                {defaultRules.map((rule, i) => (
                  <div key={rule.id} style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}>
                    <RuleRow rule={rule} readOnly />
                  </div>
                ))}
              </Card>
            )}
          </div>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New rule">
        <RuleForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit rule">
        {editing && (
          <RuleForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete rule">
        {deleting && (
          <div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Delete rule for keyword <strong style={{ color: 'var(--text-primary)' }}>"{deleting.keyword}"</strong>?
            </p>
            <div className="flex gap-3">
              <Button variant="danger" className="flex-1 justify-center" onClick={handleDelete}>Delete</Button>
              <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

interface RuleRowProps {
  rule:      Rule
  readOnly?: boolean
  onEdit?:   () => void
  onDelete?: () => void
}

function RuleRow({ rule, readOnly, onEdit, onDelete }: RuleRowProps) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 transition-colors group"
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <span className="text-xs font-mono w-6 text-center flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        {rule.priority}
      </span>

      <code
        className="text-xs px-2 py-0.5 rounded flex-shrink-0"
        style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}
      >
        {rule.keyword}
      </code>

      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        in {rule.match_field}
      </span>

      <span className="text-xs" style={{ color: 'var(--border)' }}>→</span>

      {rule.categories && (
        <Badge color={rule.categories.color ?? undefined} className="flex-shrink-0">
          {rule.categories.icon} {rule.categories.name}
        </Badge>
      )}

      {rule.is_default && (
        <Badge className="text-[10px] flex-shrink-0">default</Badge>
      )}

      <div className="flex-1" />

      {!readOnly && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="text-xs px-2 py-1 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >Edit</button>
          <button
            onClick={onDelete}
            className="text-xs px-2 py-1 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >Del</button>
        </div>
      )}
    </div>
  )
}