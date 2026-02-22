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
  const [search,      setSearch]      = useState('')
  const [accountId,   setAccountId]   = useState('')
  const [categoryId,  setCategoryId]  = useState('')
  const [type,        setType]        = useState('')
  const [dateFrom,    setDateFrom]    = useState('')
  const [dateTo,      setDateTo]      = useState('')
  const [page,        setPage]        = useState(1)

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

  const allSelected = transactions.length > 0 && selected.size === transactions.length
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
          <div className="flex gap-2">
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
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          />
        </div>
      </Card>

      {/* List */}
      <Card className="divide-y divide-zinc-800/50">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#c8f65d] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">↕</p>
            <p className="text-white font-medium mb-1">No transactions found</p>
            <p className="text-zinc-500 text-sm mb-4">Try adjusting your filters or add a new transaction</p>
            <Button onClick={() => setShowCreate(true)}>+ Add transaction</Button>
          </div>
        ) : (
          <div className="p-2">
            {/* Select all row */}
            <div className="flex items-center gap-3 px-3 py-2 mb-1 border-b border-zinc-800">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded accent-[#c8f65d] cursor-pointer"
              />
              <span className="text-zinc-500 text-xs">
                {someSelected ? `${selected.size} selected` : `Select all (${transactions.length})`}
              </span>
            </div>

            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggleSelect(t.id)}
                  className="w-4 h-4 rounded accent-[#c8f65d] cursor-pointer flex-shrink-0 ml-1"
                />
                <div className="flex-1 min-w-0">
                  <TransactionRow
                    transaction={t}
                    onEdit={() => setEditing(t)}
                    onDelete={() => setDeleting(t)}
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
          <span className="text-zinc-500 text-sm">
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
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
            <p className="text-zinc-300 text-sm mb-6">
              Delete <strong className="text-white">{deleting.merchant ?? deleting.description}</strong> — {deleting.amount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD?
            </p>
            <div className="flex gap-3">
              <Button variant="danger" className="flex-1 justify-center" onClick={handleDelete}>
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk delete confirm */}
      <Modal open={bulkDeleting} onClose={() => setBulkDeleting(false)} title="Delete selected">
        <p className="text-zinc-300 text-sm mb-6">
          Delete <strong className="text-white">{selected.size} transactions</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1 justify-center"
            onClick={handleBulkDelete}
            disabled={bulkLoading}
          >
            {bulkLoading ? 'Deleting...' : `Delete ${selected.size}`}
          </Button>
          <Button variant="secondary" onClick={() => setBulkDeleting(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}