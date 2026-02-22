import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Signup() {
  const { signup }          = useAuth()
  const navigate            = useNavigate()
  const [email, setEmail]   = useState('')
  const [pass,  setPass]    = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (pass !== confirm) { setError('Passwords do not match'); return }
    if (pass.length < 8)  { setError('Password must be at least 8 characters'); return }
    setError('')
    setLoading(true)
    try {
      await signup(email, pass)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(200,246,93,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(200,246,93,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <span className="inline-block text-[#c8f65d] font-black text-3xl tracking-tight">
            DRHM<span className="text-white">.</span>
          </span>
          <p className="text-zinc-500 text-sm mt-1 font-mono">Personal Finance — MAD</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm">
          <h1 className="text-white font-bold text-xl mb-1">Create account</h1>
          <p className="text-zinc-500 text-sm mb-8">Start tracking your finances</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#c8f65d] focus:ring-1 focus:ring-[#c8f65d]/20 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#c8f65d] focus:ring-1 focus:ring-[#c8f65d]/20 transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#c8f65d] focus:ring-1 focus:ring-[#c8f65d]/20 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c8f65d] hover:bg-[#d4f870] text-black font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#c8f65d] hover:text-[#d4f870] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}