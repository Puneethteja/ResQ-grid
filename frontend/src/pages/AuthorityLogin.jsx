import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, LogIn } from 'lucide-react'
import { login } from '../lib/api.js'
import { setSession } from '../lib/authoritySession.js'

export default function AuthorityLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const cleanUser = username.trim()
    if (!cleanUser) {
      setError('Please enter your officer username or official email.')
      return
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const sessionData = await login(cleanUser, password, 'authority')
      setSession(sessionData)
      navigate('/authority', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid credentials or access level.')
      setShake(true)
      setTimeout(() => setShake(false), 450)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--ink)' }}>
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm rounded-lg p-6 ${shake ? 'auth-shake' : ''}`}
        style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={18} style={{ color: 'var(--signal)' }} />
          <span className="font-mono text-[11px] tracking-widest uppercase" style={{ color: 'var(--mist)' }}>
            Restricted Access
          </span>
        </div>
        <h1 className="font-display text-xl text-white mb-6">Authority Command Room</h1>

        <div className="space-y-3">
          <div>
            <label className="font-mono text-[11px] tracking-widest uppercase block mb-1.5" style={{ color: 'var(--mist)' }}>
              Username
            </label>
            <input
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md px-3 py-2.5 text-sm outline-none"
              style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)', color: 'white' }}
            />
          </div>
          <div>
            <label className="font-mono text-[11px] tracking-widest uppercase block mb-1.5" style={{ color: 'var(--mist)' }}>
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md px-3 py-2.5 text-sm outline-none"
              style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)', color: 'white' }}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm mt-3" style={{ color: 'var(--hazard)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-5 rounded-md py-2.5 font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:opacity-95"
          style={{ background: 'var(--signal)' }}
        >
          <LogIn size={16} />
          {loading ? 'Verifying credentials…' : 'Enter Command Room'}
        </button>

        <p className="text-xs mt-4 text-center" style={{ color: 'var(--mist)' }}>
          Authorized personnel only. All access attempts are logged.
        </p>
      </form>
    </div>
  )
}