import { useState, FormEvent } from 'react'
import { Input }         from '../ui/Input'
import { Select }        from '../ui/Select'
import { Button }        from '../ui/Button'
import { useCategories } from '../../hooks/useCategories'

interface RulePayload {
  keyword:     string
  category_id: string
  priority:    number
  match_field: 'description' | 'merchant'
}

interface RuleFormProps {
  initial?:  Partial<RulePayload> & { id?: string }
  onSubmit:  (data: RulePayload) => Promise<void>
  onCancel:  () => void
}

export function RuleForm({ initial, onSubmit, onCancel }: RuleFormProps) {
  const { categories } = useCategories()

  const [keyword,    setKeyword]    = useState(initial?.keyword    ?? '')
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [priority,   setPriority]   = useState(String(initial?.priority ?? '10'))
  const [matchField, setMatchField] = useState<'description' | 'merchant'>(initial?.match_field ?? 'description')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const categoryOptions = [
    { value: '', label: 'Select category...' },
    ...categories.map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}` })),
  ]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!keyword)    { setError('Enter a keyword'); return }
    if (!categoryId) { setError('Select a category'); return }
    setLoading(true)
    setError('')
    try {
      await onSubmit({
        keyword:     keyword.toLowerCase().trim(),
        category_id: categoryId,
        priority:    parseInt(priority),
        match_field: matchField,
      })
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

      <Input
        label="Keyword"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="e.g. marjane, glovo, apple"
        required
      />

      <Select
        label="Match field"
        value={matchField}
        onChange={(e) => setMatchField(e.target.value as 'description' | 'merchant')}
        options={[
          { value: 'description', label: 'Description' },
          { value: 'merchant',    label: 'Merchant' },
        ]}
      />

      <Select
        label="Assign category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categoryOptions}
      />

      <Input
        label="Priority (higher = matched first)"
        type="number"
        min="1"
        max="100"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex-1 justify-center">
          {loading ? 'Saving...' : (initial?.id ? 'Save changes' : 'Create rule')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}