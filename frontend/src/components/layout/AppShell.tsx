import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(200,246,93,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(200,246,93,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <Sidebar />

      {/* Main content */}
      <main className="ml-56 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}