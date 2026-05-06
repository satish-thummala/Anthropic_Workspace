import { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16 }

export default function SettingsPage() {
  const user = useSelector((s: RootState) => s.auth.user)
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [notifications, setNotifications] = useState({ email: true, push: false, weekly: true, security: true })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange}
      className="relative rounded-full transition-all shrink-0"
      style={{ background: value ? '#6366f1' : '#e5e7eb', height: 22, width: 42 }}>
      <span className="absolute rounded-full bg-white shadow-sm transition-all"
        style={{ left: value ? 22 : 2, width: 18, height: 18, top: 2 }} />
    </button>
  )

  const inputStyle = {
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    color: '#1e293b',
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-400">Manage your account and preferences</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-emerald-700"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Settings saved successfully!
        </div>
      )}

      {/* Profile */}
      <div className="p-6" style={cardStyle}>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Profile</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {user?.avatar}
          </div>
          <div>
            <div className="text-slate-800 font-medium">{user?.name}</div>
            <div className="text-sm text-slate-400">{user?.role}</div>
            <button className="text-xs text-indigo-500 hover:text-indigo-700 mt-1 transition-colors">Change avatar</button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1.5 font-medium">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#6366f1')}
              onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1.5 font-medium">Email Address</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#6366f1')}
              onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="p-6" style={cardStyle}>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Notifications</h3>
        <div className="space-y-4">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
            { key: 'push', label: 'Push Notifications', desc: 'Browser push alerts' },
            { key: 'weekly', label: 'Weekly Digest', desc: 'Summary every Monday' },
            { key: 'security', label: 'Security Alerts', desc: 'Login and access notifications' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#f8fafc' }}>
              <div>
                <div className="text-sm text-slate-700 font-medium">{item.label}</div>
                <div className="text-xs text-slate-400">{item.desc}</div>
              </div>
              <Toggle
                value={notifications[item.key as keyof typeof notifications]}
                onChange={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="p-6" style={cardStyle}>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Security</h3>
        <div className="space-y-2">
          {[
            { label: 'Change Password', sub: 'Last changed 30 days ago' },
            { label: 'Two-Factor Authentication', sub: 'Enabled', subColor: '#10b981' },
          ].map(item => (
            <button key={item.label}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 transition-all text-left"
              style={{ border: '1px solid #f1f5f9' }}>
              <div>
                <div className="text-sm text-slate-700 font-medium">{item.label}</div>
                <div className="text-xs mt-0.5" style={{ color: item.subColor || '#94a3b8' }}>{item.sub}</div>
              </div>
              <svg width="16" height="16" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="px-5 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all">
          Cancel
        </button>
        <button onClick={handleSave}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          Save Changes
        </button>
      </div>
    </div>
  )
}
