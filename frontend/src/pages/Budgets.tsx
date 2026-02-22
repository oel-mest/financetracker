import { useState, useEffect, useCallback } from 'react'
import { api }          from '../lib/api'
import { PageHeader }   from '../components/ui/PageHeader'
import { Button }       from '../components/ui/Button'
import { Card }         from '../components/ui/Card'
import { Modal }        from '../components/ui/Modal'
import { BudgetForm }   from '../components/budgets/BudgetForm'

interface Budget {
  id:          string
  category_id: string
  amount:      number
  month:       string
  total_spent: number
  remaining:   number
  percentage:  number
  over_budget: boolean
  categories:  { name: string; color: string | null; icon: string | null }
}

function getMonthStr(offset = 0) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return d.toISOString().slice(0, 10)
}

function fmtMonthLabel(str: string) {
  return new Date(str).toLocaleDateString('fr-MA', { month: 'long', year: 'numeric' })
}

export default function Budgets() {
  const [monthOffset, setMonthOffset] = useState(0)
  const month = getMonthStr(monthOffset)

  const [budgets,    setBudgets]    = useState<Budget[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState<Budget | null>(null)
  const [deleting,   setDeleting]   = useState<Budget | null>(null)

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/budgets', { params: { month } })
      setBudgets(data)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchBudgets() }, [fetchBudgets])

  const handleCreate = async (payload: any) => {
    await api.post('/budgets', payload)
    setShowCreate(false)
    fetchBudgets()
  }

  const handleUpdate = async (payload: any) => {
    await api.patch(`/budgets/${editing!.id}`, { amount: payload.amount })
    setEditing(null)
    fetchBudgets()
  }

  const handleDelete = async () => {
    await api.delete(`/budgets/${deleting!.id}`)
    setDeleting(null)
    fetchBudgets()
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount,     0)
  const totalSpent    = budgets.reduce((s, b) => s + b.total_spent, 0)
  const overCount     = budgets.filter((b) => b.over_budget).length

  return (
    <div>
      <PageHeader
        title="Budgets"
        subtitle={`${budgets.length} budget${budgets.length !== 1 ? 's' : ''} · ${fmtMonthLabel(month)}`}
        action={<Button onClick={() => setShowCreate(true)}>+ New budget</Button>}
      />

      {/* Month navigator */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setMonthOffset((o) => o - 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >‹</button>
        <span className="text-sm capitalize px-2" style={{ color: 'var(--text-secondary)' }}>{fmtMonthLabel(month)}</span>
        <button
          onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))}
          disabled={monthOffset === 0}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors disabled:opacity-30"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >›</button>
      </div>

      {/* Summary row */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total budgeted', value: totalBudgeted, color: 'var(--text-primary)' },
            { label: 'Total spent',    value: totalSpent,    color: totalSpent > totalBudgeted ? '#f87171' : 'var(--accent)' },
            { label: 'Over budget',    value: overCount,     color: overCount > 0 ? '#f87171' : 'var(--text-muted)', suffix: ' categories' },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ color: s.color }}>
                {s.suffix
                  ? `${s.value}${s.suffix}`
                  : `${(s.value as number).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`
                }
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : budgets.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-4xl mb-3">◎</p>
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No budgets for this month</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Set spending limits per category to stay on track</p>
          <Button onClick={() => setShowCreate(true)}>+ New budget</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const color = b.over_budget ? '#f87171' : (b.categories?.color ?? 'var(--accent)')
            const pct   = Math.min(b.percentage, 100)

            return (
              <Card key={b.id} className="p-5 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {b.categories?.icon} {b.categories?.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Budget: {b.amount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: b.over_budget ? '#f87171' : 'var(--text-primary)' }}>
                      {b.percentage}%
                    </p>
                    {b.over_budget && <p className="text-xs" style={{ color: '#f87171' }}>Over budget</p>}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full overflow-hidden mb-3" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Spent: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {b.total_spent.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                    </span>
                  </span>
                  <span style={{ color: b.over_budget ? '#f87171' : 'var(--text-secondary)' }}>
                    {b.over_budget ? 'Over by' : 'Left:'}{' '}
                    <span className="font-medium">
                      {Math.abs(b.remaining).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                    </span>
                  </span>
                </div>

                <div className="flex gap-3 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setEditing(b)}
                    className="text-xs transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >Edit</button>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <button
                    onClick={() => setDeleting(b)}
                    className="text-xs transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >Delete</button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New budget">
        <BudgetForm month={month} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit budget">
        {editing && (
          <BudgetForm initial={editing} month={month} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete budget">
        {deleting && (
          <div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Delete budget for <strong style={{ color: 'var(--text-primary)' }}>{deleting.categories?.name}</strong>?
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