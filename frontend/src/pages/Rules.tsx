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
  const [rules,      setRules]      = useState<Rule[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState<Rule | null>(null)
  const [deleting,   setDeleting]   = useState<Rule | null>(null)
  const [showDefault, setShowDefault] = useState(false)

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

  const userRules    = rules.filter((r) => !r.is_default)
  const defaultRules = rules.filter((r) =>  r.is_default)

  return (
    <div>
      <PageHeader
        title="Categorization Rules"
        subtitle="Keywords that auto-assign categories to transactions"
        action={<Button onClick={() => setShowCreate(true)}>+ New rule</Button>}
      />

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-[#c8f65d] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* User rules */}
          <div>
            <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">
              Your rules ({userRules.length})
            </p>
            {userRules.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-zinc-500 text-sm mb-3">No custom rules yet.</p>
                <p className="text-zinc-600 text-xs mb-4">
                  Create rules to automatically categorize transactions by keyword.
                </p>
                <Button onClick={() => setShowCreate(true)}>+ New rule</Button>
              </Card>
            ) : (
              <Card className="divide-y divide-zinc-800/50">
                {userRules.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onEdit={() => setEditing(rule)}
                    onDelete={() => setDeleting(rule)}
                  />
                ))}
              </Card>
            )}
          </div>

          {/* Default rules */}
          <div>
            <button
              onClick={() => setShowDefault((v) => !v)}
              className="text-zinc-500 text-xs font-mono uppercase tracking-wider hover:text-zinc-300 transition-colors flex items-center gap-2 mb-3"
            >
              <span>{showDefault ? '▾' : '▸'}</span>
              Default rules ({defaultRules.length}) — read only
            </button>

            {showDefault && (
              <Card className="divide-y divide-zinc-800/50">
                {defaultRules.map((rule) => (
                  <RuleRow key={rule.id} rule={rule} readOnly />
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
          <RuleForm
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete rule">
        {deleting && (
          <div>
            <p className="text-zinc-300 text-sm mb-6">
              Delete rule for keyword <strong className="text-white">"{deleting.keyword}"</strong>?
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

// ── Rule row component ────────────────────────────────────────────────────────

interface RuleRowProps {
  rule:      Rule
  readOnly?: boolean
  onEdit?:   () => void
  onDelete?: () => void
}

function RuleRow({ rule, readOnly, onEdit, onDelete }: RuleRowProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/20 transition-colors group">
      {/* Priority badge */}
      <span className="text-zinc-600 text-xs font-mono w-6 text-center flex-shrink-0">
        {rule.priority}
      </span>

      {/* Keyword */}
      <code className="text-[#c8f65d] text-xs bg-[#c8f65d]/10 border border-[#c8f65d]/20 px-2 py-0.5 rounded flex-shrink-0">
        {rule.keyword}
      </code>

      {/* Match field */}
      <span className="text-zinc-600 text-xs flex-shrink-0">
        in {rule.match_field}
      </span>

      {/* Arrow */}
      <span className="text-zinc-700 text-xs">→</span>

      {/* Category */}
      {rule.categories && (
        <Badge color={rule.categories.color ?? undefined} className="flex-shrink-0">
          {rule.categories.icon} {rule.categories.name}
        </Badge>
      )}

      {/* Default badge */}
      {rule.is_default && (
        <Badge className="text-[10px] text-zinc-500 border-zinc-700 flex-shrink-0">default</Badge>
      )}

      <div className="flex-1" />

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      )}
    </div>
  )
}