import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import Login       from './pages/auth/Login'
import Signup      from './pages/auth/Signup'
import Dashboard   from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Accounts    from './pages/Accounts'
import Budgets     from './pages/Budgets'
import Imports     from './pages/Imports'
import Rules       from './pages/Rules'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/accounts"     element={<Accounts />} />
            <Route path="/budgets"      element={<Budgets />} />
            <Route path="/imports"      element={<Imports />} />
            <Route path="/rules"        element={<Rules />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}