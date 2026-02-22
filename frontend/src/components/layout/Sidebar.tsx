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

  const isDark = theme === 'dark'

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

      {/* Bottom section */}
      <div className="px-4 py-4 space-y-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}>

        {/* User info */}
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
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

        {/* Theme toggle pill */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--sidebar-border)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{isDark ? '🌙' : '☀️'}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--sidebar-text)' }}>
              {isDark ? 'Dark mode' : 'Light mode'}
            </span>
          </div>
          {/* Pill indicator */}
          <div
            className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'var(--accent)' }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
              style={{
                backgroundColor: isDark ? 'var(--sidebar-text)' : '#fff',
                left: isDark ? '2px' : '18px',
              }}
            />
          </div>
        </button>

        {/* Sign out — full width red button */}
        <button
          onClick={handleLogout}
          className="w-full py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors"
          style={{
            backgroundColor: 'rgba(239,68,68,0.12)',
            color: '#f87171',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.22)'
            e.currentTarget.style.color = '#fca5a5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'
            e.currentTarget.style.color = '#f87171'
          }}
        >
          Sign out
        </button>

      </div>
    </aside>
  )
}