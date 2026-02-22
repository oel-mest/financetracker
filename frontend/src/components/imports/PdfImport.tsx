import { useState, useRef } from 'react'
import { api }           from '../../lib/api'
import { supabase }      from '../../lib/supabase'
import { Button }        from '../ui/Button'
import { Select }        from '../ui/Select'
import { useAccounts }   from '../../hooks/useAccounts'
import { ImportPreview } from './ImportPreview'
import { useAuth }       from '../../context/AuthContext'

type Step = 'upload' | 'preview' | 'done'

export function PdfImport() {
  const { accounts } = useAccounts()
  const { user }     = useAuth()
  const fileRef      = useRef<HTMLInputElement>(null)

  const [step,        setStep]        = useState<Step>('upload')
  const [accountId,   setAccountId]   = useState('')
  const [year,        setYear]        = useState(String(new Date().getFullYear()))
  const [loading,     setLoading]     = useState(false)
  const [uploadPct,   setUploadPct]   = useState(0)
  const [error,       setError]       = useState('')
  const [importId,    setImportId]    = useState('')
  const [preview,     setPreview]     = useState<any[]>([])
  const [result,      setResult]      = useState<{ inserted: number; skipped: number } | null>(null)

  const accountOptions = [
    { value: '', label: 'Select account...' },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ]

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = String(currentYear - i)
    return { value: y, label: y }
  })

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file)      { setError('Please select a PDF file'); return }
    if (!accountId) { setError('Please select an account'); return }
    if (!user)      { setError('Not authenticated'); return }

    setLoading(true)
    setError('')
    setUploadPct(0)

    try {
      // 1. Upload PDF to Supabase Storage
      const storagePath = `${user.id}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('imports')
        .upload(storagePath, file, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)
      setUploadPct(50)

      // 2. Call backend to parse
      const { data } = await api.post('/imports/pdf', {
        account_id:   accountId,
        storage_path: storagePath,
        year:         parseInt(year),
      })

      setUploadPct(100)
      setImportId(data.import_id)
      setPreview(data.transactions)
      setStep('preview')
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.message ?? 'Upload failed')
    } finally {
      setLoading(false)
      setUploadPct(0)
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
        onConfirmed={() => {
          const inserted = preview.filter((r) => !r.is_duplicate).length
          const skipped  = preview.filter((r) =>  r.is_duplicate).length
          setResult({ inserted, skipped })
          setStep('done')
        }}
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

      <Select
        label="Statement year"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        options={yearOptions}
      />

      <div>
        <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">
          CIH Bank PDF statement
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-zinc-700 hover:border-[#c8f65d]/50 rounded-xl p-8 text-center cursor-pointer transition-colors group"
        >
          <p className="text-3xl mb-2 group-hover:scale-110 transition-transform">🏦</p>
          <p className="text-white text-sm font-medium">Click to select a PDF</p>
          <p className="text-zinc-500 text-xs mt-1">CIH Bank e-banking statement (.pdf)</p>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" />
        </div>
      </div>

      {loading && uploadPct > 0 && (
        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>{uploadPct < 50 ? 'Uploading to storage...' : 'Parsing with openbk...'}</span>
            <span>{uploadPct}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c8f65d] rounded-full transition-all duration-500"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
        </div>
      )}

      <Button onClick={handleUpload} disabled={loading} className="w-full justify-center">
        {loading ? 'Processing...' : 'Upload & parse'}
      </Button>
    </div>
  )
}