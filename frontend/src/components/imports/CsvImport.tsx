import { useState, useRef } from 'react'
import { api }            from '../../lib/api'
import { Button }         from '../ui/Button'
import { Select }         from '../ui/Select'
import { useAccounts }    from '../../hooks/useAccounts'
import { ImportPreview }  from './ImportPreview'

type Step = 'upload' | 'preview' | 'done'

export function CsvImport() {
  const { accounts } = useAccounts()
  const fileRef      = useRef<HTMLInputElement>(null)

  const [step,      setStep]      = useState<Step>('upload')
  const [accountId, setAccountId] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [importId,  setImportId]  = useState('')
  const [preview,   setPreview]   = useState<any[]>([])
  const [result,    setResult]    = useState<{ inserted: number; skipped: number } | null>(null)

  const accountOptions = [
    { value: '', label: 'Select account...' },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ]

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file)      { setError('Please select a CSV file'); return }
    if (!accountId) { setError('Please select an account'); return }

    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file',       file)
      form.append('account_id', accountId)

      const { data } = await api.post('/imports/csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setImportId(data.import_id)
      setPreview(data.transactions)
      setStep('preview')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done' && result) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-3">✓</p>
        <p className="text-white font-semibold text-lg mb-1">Import complete!</p>
        <p className="text-zinc-400 text-sm">
          {result.inserted} imported · {result.skipped} skipped as duplicates
        </p>
        <Button className="mt-6" onClick={() => { setStep('upload'); setResult(null); setPreview([]) }}>
          Import another file
        </Button>
      </div>
    )
  }

  if (step === 'preview') {
    return (
      <ImportPreview
        importId={importId}
        rows={preview}
        onConfirmed={() => { setStep('done'); setResult({ inserted: preview.filter((r) => !r.is_duplicate).length, skipped: preview.filter((r) => r.is_duplicate).length }) }}
        onCancel={() => setStep('upload')}
      />
    )
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <Select
        label="Target account"
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        options={accountOptions}
      />

      {/* Drop zone */}
      <div>
        <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">
          CSV file
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-zinc-700 hover:border-[#c8f65d]/50 rounded-xl p-8 text-center cursor-pointer transition-colors group"
        >
          <p className="text-3xl mb-2 group-hover:scale-110 transition-transform">⇡</p>
          <p className="text-white text-sm font-medium">Click to select a CSV file</p>
          <p className="text-zinc-500 text-xs mt-1">
            Columns: date, description, amount, type (required) · merchant, notes, tags (optional)
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" />
        </div>
      </div>

      <Button onClick={handleUpload} disabled={loading} className="w-full justify-center">
        {loading ? 'Parsing...' : 'Upload & preview'}
      </Button>
    </div>
  )
}