import { useState, FormEvent } from 'react'
import { Input }   from '../ui/Input'
import { Select }  from '../ui/Select'
import { Button }  from '../ui/Button'
import { Account } from '../../hooks/useAccounts'

const ACCOUNT_COLORS = [
  '#c8f65d', '#60a5fa', '#f97316', '#a78bfa',
  '#34d399', '#fb7185', '#fbbf24', '#94a3b8',
]

const TYPE_OPTIONS = [
  { value: 'cash', label: '💵  Cash' },
  { value: 'card', label: '💳  Card' },
  { value: 'cih',  label: '🏦  CIH Bank' },
]

interface AccountFormProps {
  initial?:   Partial<Account>
  onSubmit:   (data: Partial<Account>) => Promise<void>
  onCancel:   () => void
}

export function AccountForm({ initial, onSubmit, onCancel }: AccountFormProps) {
  const [name,    setName]    = useState(initial?.name    ?? '')
  const [type,    setType]    = useState<'cash' | 'card' | 'cih'>(initial?.type ?? 'cash')
  const [balance, setBalance] = useState(String(initial?.balance ?? '0'))
  const [color,   setColor]   = useState(initial?.color   ?? ACCOUNT_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSubmit({ name, type, balance: parseFloat(balance), color, currency: 'MAD' })
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
        label="Account name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. CIH Compte courant"
        required
      />

      <Select
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value as 'cash' | 'card' | 'cih')}
        options={TYPE_OPTIONS}
      />

      <Input
        label="Current balance (MAD)"
        type="number"
        step="0.01"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
        placeholder="0.00"
      />

      <div className="space-y-1.5">
        <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider">Color</label>
        <div className="flex gap-2 flex-wrap">
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex-1 justify-center">
          {loading ? 'Saving...' : (initial?.id ? 'Save changes' : 'Create account')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}