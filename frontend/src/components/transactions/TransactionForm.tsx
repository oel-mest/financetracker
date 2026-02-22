import { useState, FormEvent } from 'react'
import { Input }          from '../ui/Input'
import { Select }         from '../ui/Select'
import { Button }         from '../ui/Button'
import { useAccounts }    from '../../hooks/useAccounts'
import { useCategories }  from '../../hooks/useCategories'

export interface TransactionPayload {
  account_id:  string
  category_id: string | null
  type:        'debit' | 'credit'
  amount:      number
  description: string
  merchant:    string
  notes:       string
  tags:        string[]
  date:        string
}

interface TransactionFormProps {
  initial?:  Partial<TransactionPayload>
  onSubmit:  (data: TransactionPayload) => Promise<void>
  onCancel:  () => void
}

export function TransactionForm({ initial, onSubmit, onCancel }: TransactionFormProps) {
  const { accounts }   = useAccounts()
  const { categories } = useCategories()

  const [accountId,   setAccountId]   = useState(initial?.account_id  ?? '')
  const [categoryId,  setCategoryId]  = useState(initial?.category_id ?? '')
  const [type,        setType]        = useState(initial?.type        ?? 'debit')
  const [amount,      setAmount]      = useState(String(initial?.amount ?? ''))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [merchant,    setMerchant]    = useState(initial?.merchant    ?? '')
  const [notes,       setNotes]       = useState(initial?.notes       ?? '')
  const [tags,        setTags]        = useState((initial?.tags ?? []).join(', '))
  const [date,        setDate]        = useState(initial?.date ?? new Date().toISOString().slice(0, 10))
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  const accountOptions = [
    { value: '', label: 'Select account...' },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ]

  const categoryOptions = [
    { value: '', label: 'Auto-detect' },
    ...categories.map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}` })),
  ]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!accountId) { setError('Please select an account'); return }
    setLoading(true)
    setError('')
    try {
      await onSubmit({
        account_id:  accountId,
        category_id: categoryId || null,
        type:        type as 'debit' | 'credit',
        amount:      parseFloat(amount),
        description,
        merchant,
        notes,
        tags:        tags.split(',').map((t) => t.trim()).filter(Boolean),
        date,
      })
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Something went wrong'
      if (msg.includes('Duplicate')) {
        setError('This transaction already exists (duplicate detected)')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Type toggle */}
      <div className="space-y-1.5">
        <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider">Type</label>
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
          {(['debit', 'credit'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                type === t
                  ? t === 'debit'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-[#c8f65d]/20 text-[#c8f65d]'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {t === 'debit' ? '↑ Expense' : '↓ Income'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Amount (MAD)"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What was this for?"
        required
      />

      <Input
        label="Merchant (optional)"
        value={merchant}
        onChange={(e) => setMerchant(e.target.value)}
        placeholder="e.g. Marjane"
      />

      <Select
        label="Account"
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        options={accountOptions}
      />

      <Select
        label="Category (optional)"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categoryOptions}
      />

      <Input
        label="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="food, monthly, family"
      />

      <Input
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Any additional notes"
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex-1 justify-center">
          {loading ? 'Saving...' : (initial ? 'Save changes' : 'Add transaction')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}