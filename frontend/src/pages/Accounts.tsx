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
        <div className="w-6 h-6 border-2 border-[#c8f65d] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle={`Total balance: ${totalBalance.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`}
        action={
          <Button onClick={() => setShowCreate(true)}>+ New account</Button>
        }
      />

      {accounts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-4xl mb-3">◈</p>
          <p className="text-white font-medium mb-1">No accounts yet</p>
          <p className="text-zinc-500 text-sm mb-4">Add your first account to start tracking</p>
          <Button onClick={() => setShowCreate(true)}>+ New account</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="p-5 hover:border-zinc-700 transition-colors">
              {/* Color stripe */}
              <div
                className="w-8 h-1 rounded-full mb-4"
                style={{ backgroundColor: account.color ?? '#c8f65d' }}
              />

              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-semibold text-base">{account.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {TYPE_ICON[account.type]} {TYPE_LABEL[account.type]}
                  </p>
                </div>
              </div>

              <p className="text-2xl font-bold text-white mb-1">
                {account.balance.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                <span className="text-zinc-500 text-sm font-normal ml-1">MAD</span>
              </p>

              <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setEditing(account)}
                  className="text-zinc-400 hover:text-white text-xs transition-colors"
                >
                  Edit
                </button>
                <span className="text-zinc-700">·</span>
                <button
                  onClick={() => setDeleting(account)}
                  className="text-zinc-400 hover:text-red-400 text-xs transition-colors"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New account">
        <AccountForm
          onSubmit={async (data) => { await create(data); setShowCreate(false) }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit account">
        {editing && (
          <AccountForm
            initial={editing}
            onSubmit={async (data) => { await update(editing.id, data); setEditing(null) }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete account">
        {deleting && (
          <div>
            <p className="text-zinc-300 text-sm mb-6">
              Are you sure you want to delete <strong className="text-white">{deleting.name}</strong>?
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