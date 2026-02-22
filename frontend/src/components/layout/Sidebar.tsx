import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const nav = [
  { to: '/',              icon: '▦',  label: 'Dashboard'     },
  { to: '/transactions',  icon: '↕',  label: 'Transactions'  },
  { to: '/accounts',      icon: '◈',  label: 'Accounts'      },
  { to: '/budgets',       icon: '◎',  label: 'Budgets'       },
  { to: '/imports',       icon: '⇡',  label: 'Import'        },
  { to: '/rules',         icon: '⚙',  label: 'Rules'         },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-zinc-900/80 border-r border-zinc-800 backdrop-blur-sm flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-zinc-800">
        <span className="text-[#c8f65d] font-black text-2xl tracking-tight">
          DRHM<span className="text-white">.</span>
        </span>
        <p className="text-zinc-600 text-xs font-mono mt-0.5">Finance Tracker</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#c8f65d]/10 text-[#c8f65d] border border-[#c8f65d]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-[#c8f65d]/20 border border-[#c8f65d]/30 flex items-center justify-center">
            <span className="text-[#c8f65d] text-xs font-bold">
              {user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <span className="text-zinc-400 text-xs truncate flex-1">{user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-2 text-zinc-500 hover:text-red-400 text-xs py-1.5 px-3 rounded-lg hover:bg-red-500/5 transition-colors text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}