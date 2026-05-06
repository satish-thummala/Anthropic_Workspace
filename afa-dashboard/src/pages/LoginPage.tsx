import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login, clearError } from '../store'
import { RootState, AppDispatch } from '../store'
import { ENTITY_USERS } from '../data/entityConfig'

const HINTS = [
  { entity: 'Group CEO',                      email: 'ceo@afa.group',                password: 'afa2025',        color: '#3b82f6' },
  { entity: 'AFA Project & Mgmt Services',    email: 'head@afapm.group',             password: 'afapm2025',      color: '#10b981' },
  { entity: 'AFA PRIME Berhad',               email: 'head@afaprime.group',          password: 'afaprime2025',   color: '#8b5cf6' },
  { entity: 'AFA Systems & Services',         email: 'head@afasystems.group',        password: 'afasys2025',     color: '#06b6d4' },
  { entity: 'AFA Construction & Engineering', email: 'head@afaconstruction.group',   password: 'afacon2025',     color: '#f59e0b' },
  { entity: 'AFA Properties',                 email: 'head@afaproperties.group',     password: 'afaprop2025',    color: '#ec4899' },
  { entity: 'AFA Infrastructure & Dev',       email: 'head@afainfra.group',          password: 'afainfra2025',   color: '#f97316' },
  { entity: 'Terratech Consultants',          email: 'head@terratech.group',         password: 'terratech2025',  color: '#84cc16' },
]

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isAuthenticated, user, error } = useSelector((s: RootState) => s.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showHints, setShowHints] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.defaultPath, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    dispatch(clearError())
    await new Promise(r => setTimeout(r, 800))
    dispatch(login({ email, password }))
    setLoading(false)
  }

  const fillCredentials = (e: string, p: string) => {
    setEmail(e); setPassword(p); dispatch(clearError()); setShowHints(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#060a14' }}>
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-60 -left-60 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #1e40af 0%, transparent 70%)' }} />
        <div className="absolute -bottom-60 -right-60 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4"
            style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', boxShadow: '0 0 60px rgba(37,99,235,0.4)' }}>
            <span className="text-white font-black text-2xl tracking-tight">AFA</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AFA Group</h1>
          <p className="mt-1 text-sm" style={{ color: '#3b82f6' }}>Intelligence Platform · Secure Access</p>
        </div>

        <div className="rounded-2xl p-7" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
          <h2 className="text-lg font-semibold text-white mb-1">Sign In</h2>
          <p className="text-sm text-slate-400 mb-5">Each entity head has personalised access</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); dispatch(clearError()) }}
                placeholder="your@afa.group" required
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.6)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); dispatch(clearError()) }}
                  placeholder="••••••••" required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.6)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all"
              style={{ background: loading ? 'rgba(37,99,235,0.5)' : 'linear-gradient(135deg, #1e40af, #2563eb)', boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.4)', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
                    </svg>
                    Authenticating…
                  </span>
                : 'Access Platform'}
            </button>
          </form>

          {/* Demo credentials toggle */}
          <button type="button" onClick={() => setShowHints(!showHints)}
            className="w-full mt-4 py-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 10, border: '1px dashed rgba(59,130,246,0.25)' }}>
            {showHints ? '▲ Hide' : '▼ Show'} demo credentials ({HINTS.length} entity logins)
          </button>

          {showHints && (
            <div className="mt-3 space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {HINTS.map(h => (
                <button key={h.email} type="button" onClick={() => fillCredentials(h.email, h.password)}
                  className="w-full text-left px-3 py-2.5 rounded-xl transition-all hover:opacity-90"
                  style={{ background: `${h.color}12`, border: `1px solid ${h.color}30` }}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-white">{h.entity}</div>
                      <div className="text-xs mt-0.5" style={{ color: h.color }}>{h.email}</div>
                    </div>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: h.color }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">© 2025 AFA Group Holdings · Confidential</p>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:0.1} 50%{opacity:0.2} }`}</style>
    </div>
  )
}
