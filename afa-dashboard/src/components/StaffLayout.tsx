import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store'
import { RootState, AppDispatch } from '../store'

const ICONS: Record<string, JSX.Element> = {
  grid:     <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  layers:   <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  check:    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  users:    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  money:    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  doc:      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  shield:   <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
}

export default function StaffLayout() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate  = useNavigate()
  const location  = useLocation()
  const user = useSelector((s: RootState) => s.auth.user)
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const accentColor = user.entityColor
  const accentBg    = user.entityBg
  const allItems    = user.navGroups.flatMap(g => g.items)
  const pageTitle   = allItems.find(n => location.pathname === n.path)?.label ?? 'Data Entry'

  const handleLogout = () => { dispatch(logout()); navigate('/login', { replace: true }) }

  const today = new Date().toLocaleDateString('en-MY', { dateStyle: 'full' })

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs"
          style={{ background: accentBg }}>
          {user.entityShort.slice(0, 4)}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-white text-xs leading-tight truncate">Data Entry Portal</div>
          <div className="text-xs truncate" style={{ color: accentColor }}>{user.entity}</div>
        </div>
      </div>

      {/* Staff info */}
      <div className="mx-3 mt-3 mb-2 px-3 py-2.5 rounded-xl" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: accentBg }}>{user.avatar}</div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user.name}</div>
            <div className="text-xs truncate" style={{ color: accentColor }}>Staff · Data Entry</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {user.navGroups.map(grp => (
          <div key={grp.group} className="mb-2">
            <p className="text-xs font-semibold px-3 mb-1.5 tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {grp.group}
            </p>
            {grp.items.map(item => (
              <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ` +
                  (isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5')
                }
                style={({ isActive }) => isActive
                  ? { background: `${accentColor}22`, border: `1px solid ${accentColor}50` }
                  : { border: '1px solid transparent' }}
              >
                {({ isActive }) => (
                  <>
                    <span style={{ color: isActive ? accentColor : undefined }}>{ICONS[item.iconKey] ?? ICONS['grid']}</span>
                    <span className="truncate">{item.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accentColor }} />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Today's date */}
      <div className="mx-3 mb-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-xs text-slate-400">Today's Date</div>
        <div className="text-xs font-semibold text-white mt-0.5">{today}</div>
      </div>

      {/* Sign out */}
      <div className="px-2 pb-3">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round"/>
            <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080c18' }}>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col shrink-0" style={{ width: 220, background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 lg:hidden flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 220, background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: '#f1f5f9' }}>
        {/* Topbar */}
        <header className="shrink-0 flex items-center justify-between px-6 h-14 bg-white" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-800">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">{pageTitle}</h1>
              <p className="text-xs text-slate-400">{user.entity} · Staff Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: accentBg }}>
              STAFF
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: accentBg }}>
              {user.avatar}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
