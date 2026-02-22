import { useState, useEffect, useCallback } from 'react'
import { api }                  from '../lib/api'
import { PageHeader }           from '../components/ui/PageHeader'
import { Button }               from '../components/ui/Button'
import { Card }                 from '../components/ui/Card'
import { Input }                from '../components/ui/Input'
import { Select }               from '../components/ui/Select'
import { Modal }                from '../components/ui/Modal'
import { TransactionRow, Transaction } from '../components/transactions/TransactionRow'
import { TransactionForm, TransactionPayload } from '../components/transactions/TransactionForm'
import { useAccounts }          from '../hooks/useAccounts'
import { useCategories }        from '../hooks/useCategories'

interface Pagination {
  total: number; page: number; limit: number; pages: number
}

export default function Transactions() {
  const { accounts }   = useAccounts()
  const { categories } = useCategories()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination,   setPagination]   = useState<Pagination | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [showCreate,   setShowCreate]   = useState(false)
  const [editing,      setEditing]      = useState<Transaction | null>(null)
  const [deleting,     setDeleting]     = useState<Transaction | null>(null)
  const [selected,     setSelected]     = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkLoading,  setBulkLoading]  = useState(false)

  // Filters
  const [search,     setSearch]     = useState('')
  const [accountId,  setAccountId]  = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [type,       setType]       = useState('')
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [page,       setPage]       = useState(1)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), limit: '30' }
      if (search)     params.search      = search
      if (accountId)  params.account_id  = accountId
      if (categoryId) params.category_id = categoryId
      if (type)       params.type        = type
      if (dateFrom)   params.date_from   = dateFrom
      if (dateTo)     params.date_to     = dateTo

      const { data } = await api.get('/transactions', { params })
      setTransactions(data.data)
      setPagination(data.pagination)
      setSelected(new Set())
    } finally {
      setLoading(false)
    }
  }, [search, accountId, categoryId, type, dateFrom, dateTo, page])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const handleCreate = async (payload: TransactionPayload) => {
    await api.post('/transactions', payload)
    setShowCreate(false)
    fetchTransactions()
  }

  const handleUpdate = async (payload: TransactionPayload) => {
    await api.patch(`/transactions/${editing!.id}`, payload)
    setEditing(null)
    fetchTransactions()
  }

  const handleDelete = async () => {
    await api.delete(`/transactions/${deleting!.id}`)
    setDeleting(null)
    fetchTransactions()
  }

  const handleBulkDelete = async () => {
    setBulkLoading(true)
    try {
      await Promise.all([...selected].map((id) => api.delete(`/transactions/${id}`)))
      setBulkDeleting(false)
      setSelected(new Set())
      fetchTransactions()
    } finally {
      setBulkLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === transactions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(transactions.map((t) => t.id)))
    }
  }

  const allSelected  = transactions.length > 0 && selected.size === transactions.length
  const someSelected = selected.size > 0

  const accountOptions = [
    { value: '', label: 'All accounts' },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ]

  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...categories.map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}` })),
  ]

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={pagination ? `${pagination.total} transactions` : ''}
        action={
          <div className="flex gap-2 items-center">
            {someSelected && (
              <Button variant="danger" onClick={() => setBulkDeleting(true)}>
                Delete {selected.size} selected
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)}>+ Add</Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          <Select
            value={accountId}
            onChange={(e) => { setAccountId(e.target.value); setPage(1) }}
            options={accountOptions}
          />
          <Select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1) }}
            options={categoryOptions}
          />
          <Select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1) }}
            options={[
              { value: '', label: 'All types' },
              { value: 'debit',  label: '↑ Expense' },
              { value: 'credit', label: '↓ Income' },
            ]}
          />
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
          <Input type="date" value={dateTo}   onChange={(e) => { setDateTo(e.target.value);   setPage(1) }} />
        </div>
      </Card>

      {/* List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">↕</p>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No transactions found</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or add a new transaction</p>
            <Button onClick={() => setShowCreate(true)}>+ Add transaction</Button>
          </div>
        ) : (
          <div className="p-2">
            {/* Always-visible select-all bar */}
            <div
              className="flex items-center gap-3 px-3 py-2 mb-1 rounded-lg"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <button
                onClick={toggleSelectAll}
                className="text-xs px-3 py-1 rounded-md font-medium transition-colors"
                style={{
                  backgroundColor: allSelected ? 'var(--accent-muted)' : 'var(--bg-hover)',
                  color: allSelected ? 'var(--accent)' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                {allSelected ? '✓ Deselect all' : `Select all (${transactions.length})`}
              </button>
              {someSelected && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {selected.size} selected
                </span>
              )}
            </div>

            {/* Rows — checkbox reveals on hover via CSS group */}
            <style>{`
              .tx-row:hover .tx-checkbox { opacity: 1 !important; }
            `}</style>

            {transactions.map((t) => (
              <div key={t.id} className="tx-row relative">
                {/* Hover-reveal checkbox */}
                <div
                  className="tx-checkbox absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-opacity"
                  style={{ opacity: selected.has(t.id) ? 1 : 0 }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleSelect(t.id)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: 'var(--accent)' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div style={{ paddingLeft: '28px' }}>
                  <TransactionRow
                    transaction={t}
                    onEdit={() => setEditing(t)}
                    onDelete={() => setDeleting(t)}
                    selected={selected.has(t.id)}
                    onSelect={() => toggleSelect(t.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add transaction" width="max-w-xl">
        <TransactionForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit transaction" width="max-w-xl">
        {editing && (
          <TransactionForm
            initial={{
              account_id:  editing.accounts ? accounts.find(a => a.name === editing.accounts?.name)?.id ?? '' : '',
              category_id: editing.categories ? categories.find(c => c.name === editing.categories?.name)?.id ?? '' : '',
              type:        editing.type,
              amount:      editing.amount,
              description: editing.description,
              merchant:    editing.merchant ?? '',
              notes:       editing.notes    ?? '',
              tags:        editing.tags     ?? [],
              date:        editing.date,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete transaction">
        {deleting && (
          <div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Delete <strong style={{ color: 'var(--text-primary)' }}>{deleting.merchant ?? deleting.description}</strong> — {deleting.amount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD?
            </p>
            <div className="flex gap-3">
              <Button variant="danger" className="flex-1 justify-center" onClick={handleDelete}>Delete</Button>
              <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={bulkDeleting} onClose={() => setBulkDeleting(false)} title="Delete selected">
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Delete <strong style={{ color: 'var(--text-primary)' }}>{selected.size} transactions</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" className="flex-1 justify-center" onClick={handleBulkDelete} disabled={bulkLoading}>
            {bulkLoading ? 'Deleting...' : `Delete ${selected.size}`}
          </Button>
          <Button variant="secondary" onClick={() => setBulkDeleting(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}