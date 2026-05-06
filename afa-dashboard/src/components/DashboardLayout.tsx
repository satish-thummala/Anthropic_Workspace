import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store'
import { RootState, AppDispatch } from '../store'
import { getNotifications, Notification } from '../data/notifications'

// ── Icon map ──────────────────────────────────────────────────
const ICONS: Record<string, JSX.Element> = {
  grid:     <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  layers:   <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  check:    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  users:    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  activity: <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  shield:   <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  flow:     <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  chat:     <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  doc:      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  money:    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
}

// ── Notification type styles ──────────────────────────────────
const NOTIF_STYLES: Record<string, { icon: string; dot: string; bg: string; border: string }> = {
  alert:    { icon: '🔴', dot: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  warning:  { icon: '⚠️', dot: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  approval: { icon: '⏳', dot: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  info:     { icon: 'ℹ️', dot: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  success:  { icon: '✅', dot: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
}

// ── Notification Panel Component ──────────────────────────────
function NotificationPanel({
  notifications, onMarkRead, onMarkAllRead, onClose, accentColor,
}: {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onClose: () => void
  accentColor: string
}) {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div
      className="absolute right-0 top-12 z-50 w-96 rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: '#fff', border: '1px solid #e2e8f0', maxHeight: '520px', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: '#f1f5f9' }}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: '#ef4444' }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead}
              className="text-xs font-medium transition-colors hover:opacity-70"
              style={{ color: accentColor }}>
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="mb-3 opacity-40">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map((notif, i) => {
            const st = NOTIF_STYLES[notif.type] ?? NOTIF_STYLES.info
            return (
              <div
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className="flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50"
                style={{
                  borderBottom: i < notifications.length - 1 ? '1px solid #f8fafc' : 'none',
                  background: notif.read ? 'transparent' : `${st.bg}80`,
                }}
              >
                {/* Type icon */}
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                  <span style={{ fontSize: 13 }}>{st.icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800 leading-tight">{notif.title}</span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: st.dot }} />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: '#94a3b8' }}>{notif.time}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: '#f1f5f9', background: '#f8fafc' }}>
        <span className="text-xs text-slate-400">
          {notifications.filter(n => n.read).length} of {notifications.length} notifications read
        </span>
      </div>
    </div>
  )
}

// ── Main Layout ───────────────────────────────────────────────
export default function DashboardLayout() {
  const dispatch  = useDispatch<AppDispatch>()
  const navigate  = useNavigate()
  const location  = useLocation()
  const user = useSelector((s: RootState) => s.auth.user)

  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [showNotifs,  setShowNotifs]  = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    user ? getNotifications(user.entityShort) : []
  )
  const bellRef = useRef<HTMLDivElement>(null)

  // Close notification panel when clicking outside
  useEffect(() => {
    if (!showNotifs) return
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifs])

  if (!user) return null

  const accentColor = user.entityColor
  const accentBg    = user.entityBg
  const unreadCount = notifications.filter(n => !n.read).length

  const handleLogout = () => { dispatch(logout()); navigate('/login', { replace: true }) }

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const allItems  = user.navGroups.flatMap(g => g.items)
  const pageTitle = allItems.find(n => location.pathname === n.path)?.label ?? 'Dashboard'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b ${collapsed ? 'justify-center' : ''}`}
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs text-center leading-tight"
          style={{ background: accentBg }}>
          {user.entityShort.length > 4 ? user.entityShort.slice(0, 4) : user.entityShort}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-bold text-white text-xs leading-tight truncate">AFA Group</div>
            <div className="text-xs truncate" style={{ color: accentColor }}>
              {user.entityShort === 'GROUP' ? 'Intelligence Platform' : user.entity}
            </div>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {user.navGroups.map(grp => (
          <div key={grp.group} className="mb-3">
            {!collapsed && (
              <p className="text-xs font-semibold px-3 mb-1.5 tracking-widest"
                style={{ color: 'rgba(255,255,255,0.25)' }}>
                {grp.group}
              </p>
            )}
            {grp.items.map(item => (
              <NavLink
                key={item.path} to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${collapsed ? 'justify-center' : ''} ` +
                  (isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5')
                }
                style={({ isActive }) => isActive
                  ? { background: `${accentColor}22`, border: `1px solid ${accentColor}50` }
                  : { border: '1px solid transparent' }}
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <span style={{ color: isActive ? accentColor : undefined }}>
                      {ICONS[item.iconKey] ?? ICONS['grid']}
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: accentColor }} />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Live indicator */}
      {!collapsed && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-xs text-emerald-400 font-medium">Live · Systems Connected</span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {user.scope === 'group' ? 'Finance · Projects · Toll · HR · DW' : user.entity}
          </div>
        </div>
      )}

      {/* User */}
      <div className="px-2 pb-3 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: accentBg }}>
              {user.avatar}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs truncate" style={{ color: accentColor }}>{user.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round"/>
            <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
          </svg>
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080c18' }}>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar desktop */}
      <aside
        className="hidden lg:flex flex-col shrink-0 transition-all duration-300"
        style={{ width: collapsed ? 64 : 232, background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.07)' }}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:hidden flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 232, background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.08)' }}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: '#f1f5f9' }}>
        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between px-6 h-14 bg-white"
          style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-800">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {collapsed
                  ? <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                  : <><line x1="21" y1="6" x2="9" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="9" y2="18"/></>}
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">{pageTitle}</h1>
              <p className="text-xs text-slate-400">{user.entity} · Live Data</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Entity badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: accentBg }}
            >
              {user.entityShort}
            </div>

            {/* Online indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-slow" />
              Online
            </div>

            {/* ── Bell icon with dropdown ────────────────── */}
            <div ref={bellRef} className="relative">
              <button
                onClick={() => setShowNotifs(v => !v)}
                className="relative text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {/* Badge */}
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white font-bold leading-none"
                    style={{ background: '#ef4444', fontSize: 9, padding: '0 3px' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {showNotifs && (
                <NotificationPanel
                  notifications={notifications}
                  onMarkRead={markRead}
                  onMarkAllRead={markAllRead}
                  onClose={() => setShowNotifs(false)}
                  accentColor={accentColor}
                />
              )}
            </div>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer"
              style={{ background: accentBg }}
            >
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
