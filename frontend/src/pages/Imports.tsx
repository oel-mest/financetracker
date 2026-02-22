import { useState } from 'react'
import { api }            from '../lib/api'
import { PageHeader }     from '../components/ui/PageHeader'
import { Button }         from '../components/ui/Button'
import { Card }           from '../components/ui/Card'
import { CsvImport }      from '../components/imports/CsvImport'
import { PdfImport }      from '../components/imports/PdfImport'
import { ImportHistory }  from '../components/imports/ImportHistory'
import { useAccounts }    from '../hooks/useAccounts'

type Tab = 'pdf' | 'csv'

export default function Imports() {
  const { accounts }      = useAccounts()
  const [tab, setTab]     = useState<Tab>('pdf')
  const [exporting, setExporting] = useState(false)
  const [exportAccountId, setExportAccountId] = useState('')

  const handleExport = async () => {
    setExporting(true)
    try {
      const params: Record<string, string> = {}
      if (exportAccountId) params.account_id = exportAccountId

      const { data } = await api.get('/imports/export', {
        params,
        responseType: 'blob',
      })

      const url  = URL.createObjectURL(new Blob([data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href  = url
      link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Import & Export"
        subtitle="Import bank statements or export your transactions"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Import */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab switcher */}
          <div
            className="flex rounded-xl overflow-hidden p-1 gap-1"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {(['pdf', 'csv'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                style={tab === t ? {
                  backgroundColor: 'var(--bg-hover)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                } : {
                  color: 'var(--text-muted)',
                  backgroundColor: 'transparent',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => { if (tab !== t) e.currentTarget.style.color = 'var(--text-secondary)' }}
                onMouseLeave={(e) => { if (tab !== t) e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                {t === 'pdf' ? '🏦  CIH Bank PDF' : '📄  CSV File'}
              </button>
            ))}
          </div>

          <Card className="p-6">
            {tab === 'pdf' ? <PdfImport /> : <CsvImport />}
          </Card>
        </div>

        {/* Right: Export + History */}
        <div className="space-y-4">
          {/* Export */}
          <Card className="p-5">
            <p className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
              Export CSV
            </p>
            <div className="space-y-3">
              <select
                value={exportAccountId}
                onChange={(e) => setExportAccountId(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">All accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? 'Exporting...' : '⇣ Download CSV'}
              </Button>
            </div>
          </Card>

          {/* History */}
          <Card className="p-5">
            <p className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
              Import history
            </p>
            <ImportHistory />
          </Card>
        </div>
      </div>
    </div>
  )
}