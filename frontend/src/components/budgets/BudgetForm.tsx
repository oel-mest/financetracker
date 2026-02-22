import { useState, FormEvent } from 'react'
import { Input }         from '../ui/Input'
import { Select }        from '../ui/Select'
import { Button }        from '../ui/Button'
import { useCategories } from '../../hooks/useCategories'

interface BudgetPayload {
  category_id: string
  amount:      number
  month:       string
}

interface BudgetFormProps {
  initial?:  Partial<BudgetPayload> & { id?: string }
  month:     string
  onSubmit:  (data: BudgetPayload) => Promise<void>
  onCancel:  () => void
}

export function BudgetForm({ initial, month, onSubmit, onCancel }: BudgetFormProps) {
  const { categories } = useCategories()

  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [amount,     setAmount]     = useState(String(initial?.amount ?? ''))
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const categoryOptions = [
    { value: '', label: 'Select category...' },
    ...categories.map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}` })),
  ]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!categoryId) { setError('Please select a category'); return }
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return }
    setLoading(true)
    setError('')
    try {
      await onSubmit({ category_id: categoryId, amount: parseFloat(amount), month })
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Something went wrong')
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

      <Select
        label="Category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categoryOptions}
        disabled={!!initial?.id}
      />

      <Input
        label="Monthly budget (MAD)"
        type="number"
        step="0.01"
        min="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        required
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex-1 justify-center">
          {loading ? 'Saving...' : (initial?.id ? 'Save changes' : 'Create budget')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}