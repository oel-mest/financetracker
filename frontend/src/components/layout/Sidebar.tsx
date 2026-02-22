import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth }  from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const nav = [
  { to: '/',             icon: '▦', label: 'Dashboard'    },
  { to: '/transactions', icon: '↕', label: 'Transactions' },
  { to: '/accounts',     icon: '◈', label: 'Accounts'     },
  { to: '/budgets',      icon: '◎', label: 'Budgets'      },
  { to: '/imports',      icon: '⇡', label: 'Import'       },
  { to: '/rules',        icon: '⚙', label: 'Rules'        },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-56 flex flex-col z-40"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <span className="font-black text-2xl tracking-tight" style={{ color: 'var(--accent)' }}>
          DRHM<span className="text-white">.</span>
        </span>
        <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--sidebar-muted)' }}>Finance Tracker</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={({ isActive }) => isActive ? {
              backgroundColor: 'var(--accent-muted)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
            } : {
              color: 'var(--sidebar-text)',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              if (!el.classList.contains('active')) {
                el.style.color = '#ffffff'
                el.style.backgroundColor = 'rgba(255,255,255,0.06)'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              if (!el.classList.contains('active')) {
                el.style.color = 'var(--sidebar-text)'
                el.style.backgroundColor = 'transparent'
              }
            }}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + controls */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}
          >
            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
              {user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <span className="text-xs truncate flex-1" style={{ color: 'var(--sidebar-muted)' }}>
            {user?.email}
          </span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full mt-2 text-xs py-1.5 px-3 rounded-lg transition-colors text-left flex items-center gap-2"
          style={{ color: 'var(--sidebar-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-muted)' }}
        >
          <span>{theme === 'dark' ? '☀' : '●'}</span>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <button
          onClick={handleLogout}
          className="w-full mt-1 text-xs py-1.5 px-3 rounded-lg transition-colors text-left"
          style={{ color: 'var(--sidebar-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sidebar-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}