import { useState } from 'react'

const USERS = [
  { id: 1, name: 'Alex Morgan', email: 'alex@enterprise.io', role: 'Admin', status: 'Active', joined: 'Jan 12, 2024', avatar: 'AM' },
  { id: 2, name: 'Sarah Kim', email: 'sarah.k@enterprise.io', role: 'Manager', status: 'Active', joined: 'Feb 8, 2024', avatar: 'SK' },
  { id: 3, name: 'James Larson', email: 'james.l@enterprise.io', role: 'Analyst', status: 'Active', joined: 'Mar 2, 2024', avatar: 'JL' },
  { id: 4, name: 'Maya Patel', email: 'maya.p@enterprise.io', role: 'Developer', status: 'Inactive', joined: 'Mar 18, 2024', avatar: 'MP' },
  { id: 5, name: 'Tom Richardson', email: 'tom.r@enterprise.io', role: 'Manager', status: 'Active', joined: 'Apr 5, 2024', avatar: 'TR' },
  { id: 6, name: 'Lena Schmidt', email: 'lena.s@enterprise.io', role: 'Analyst', status: 'Pending', joined: 'Apr 20, 2024', avatar: 'LS' },
  { id: 7, name: 'Carlos Diaz', email: 'carlos.d@enterprise.io', role: 'Developer', status: 'Active', joined: 'May 1, 2024', avatar: 'CD' },
  { id: 8, name: 'Priya Singh', email: 'priya.s@enterprise.io', role: 'Analyst', status: 'Active', joined: 'May 15, 2024', avatar: 'PS' },
]

const ROLE_COLORS: Record<string, string> = {
  Admin: '#6366f1',
  Manager: '#8b5cf6',
  Developer: '#10b981',
  Analyst: '#f59e0b',
}

const STATUS_STYLES: Record<string, string> = {
  Active: 'text-emerald-600 bg-emerald-50',
  Inactive: 'text-slate-500 bg-slate-100',
  Pending: 'text-amber-600 bg-amber-50',
}

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']
const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16 }

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const filtered = USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Users</h2>
          <p className="text-sm text-slate-400">Manage team members and permissions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Invite User
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '248' },
          { label: 'Active', value: '201' },
          { label: 'Inactive', value: '32' },
          { label: 'Pending', value: '15' },
        ].map(s => (
          <div key={s.label} className="p-4 text-center" style={cardStyle}>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users…"
          className="pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none w-full bg-white"
          style={{ border: '1px solid #e5e7eb' }}
          onFocus={e => (e.target.style.borderColor = '#6366f1')}
          onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
        />
      </div>

      <div className="overflow-hidden" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-400" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left px-5 py-3 font-medium">User</th>
                <th className="text-left px-5 py-3 font-medium">Role</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Joined</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: AVATAR_COLORS[u.id % AVATAR_COLORS.length] }}>
                        {u.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: `${ROLE_COLORS[u.role]}15`, color: ROLE_COLORS[u.role] }}>{u.role}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium w-fit px-2 py-1 rounded-full ${STATUS_STYLES[u.status]}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />{u.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{u.joined}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remove">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No users match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
