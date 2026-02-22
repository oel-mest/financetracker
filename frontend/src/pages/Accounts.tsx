import { useState } from 'react'
import { PageHeader }    from '../components/ui/PageHeader'
import { Button }        from '../components/ui/Button'
import { Card }          from '../components/ui/Card'
import { Modal }         from '../components/ui/Modal'
import { AccountForm }   from '../components/accounts/AccountForm'
import { useAccounts, Account } from '../hooks/useAccounts'

const TYPE_ICON: Record<string, string> = {
  cash: '💵', card: '💳', cih: '🏦',
}

const TYPE_LABEL: Record<string, string> = {
  cash: 'Cash', card: 'Card', cih: 'CIH Bank',
}

export default function Accounts() {
  const { accounts, loading, create, update, remove } = useAccounts()
  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState<Account | null>(null)
  const [deleting,   setDeleting]   = useState<Account | null>(null)

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle={`Total balance: ${totalBalance.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`}
        action={<Button onClick={() => setShowCreate(true)}>+ New account</Button>}
      />

      {accounts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-4xl mb-3">◈</p>
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No accounts yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Add your first account to start tracking</p>
          <Button onClick={() => setShowCreate(true)}>+ New account</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="p-5 transition-colors">
              {/* Color stripe */}
              <div className="w-8 h-1 rounded-full mb-4" style={{ backgroundColor: account.color ?? 'var(--accent)' }} />

              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{account.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {TYPE_ICON[account.type]} {TYPE_LABEL[account.type]}
                  </p>
                </div>
              </div>

              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {account.balance.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>MAD</span>
              </p>

              <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => setEditing(account)}
                  className="text-xs transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  Edit
                </button>
                <span style={{ color: 'var(--border)' }}>·</span>
                <button
                  onClick={() => setDeleting(account)}
                  className="text-xs transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New account">
        <AccountForm
          onSubmit={async (data) => { await create(data); setShowCreate(false) }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit account">
        {editing && (
          <AccountForm
            initial={editing}
            onSubmit={async (data) => { await update(editing.id, data); setEditing(null) }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete account">
        {deleting && (
          <div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleting.name}</strong>?
              This will also delete all its transactions.
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                className="flex-1 justify-center"
                onClick={async () => { await remove(deleting.id); setDeleting(null) }}
              >
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}