import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../../store'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const darkCard = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }

export default function StaffDashboard() {
  const user      = useSelector((s: RootState) => s.auth.user)
  const staffData = useSelector((s: RootState) => s.staffData)
  const navigate  = useNavigate()

  if (!user) return null

  const accentColor = user.entityColor
  const accentBg    = user.entityBg
  const today       = new Date().toLocaleDateString('en-MY', { dateStyle: 'full' })
  const todayStr    = new Date().toISOString().split('T')[0]

  const hasNavItem = (path: string) => user.navGroups.flatMap(g => g.items).some(i => i.path === path)

  // Today's submission counts
  const tollToday     = staffData.tollEntries.filter(e => e.date === todayStr).length
  const projectsToday = staffData.projectUpdates.filter(e => e.date === todayStr).length
  const hrToday       = staffData.hrEntries.filter(e => e.date === todayStr).length
  const financeToday  = staffData.financeEntries.filter(e => e.date === todayStr).length
  const procToday     = staffData.procurementEntries.filter(e => e.date === todayStr).length

  // Recent submissions across all types
  const recent = [
    ...staffData.tollEntries.map(e => ({ id: e.id, type: 'Toll Report', name: e.plazaName, time: e.submittedAt, status: e.status })),
    ...staffData.projectUpdates.map(e => ({ id: e.id, type: 'Project Update', name: e.projectName, time: e.submittedAt, status: e.status })),
    ...staffData.hrEntries.map(e => ({ id: e.id, type: 'HR Report', name: e.department, time: e.submittedAt, status: e.status })),
    ...staffData.financeEntries.map(e => ({ id: e.id, type: 'Finance Entry', name: e.description, time: e.submittedAt, status: e.status })),
    ...staffData.procurementEntries.map(e => ({ id: e.id, type: 'Procurement', name: e.itemDescription, time: e.submittedAt, status: e.status })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 8)

  const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
    draft:     { bg: '#f1f5f9', text: '#64748b' },
    submitted: { bg: '#eff6ff', text: '#1d4ed8' },
    approved:  { bg: '#f0fdf4', text: '#15803d' },
    rejected:  { bg: '#fef2f2', text: '#dc2626' },
  }

  const quickActions = [
    { label: 'Toll Daily Report',    path: '/staff/toll',        color: '#f97316', icon: '🛣', show: hasNavItem('/staff/toll') },
    { label: 'Project Update',       path: '/staff/projects',    color: '#10b981', icon: '🏗', show: hasNavItem('/staff/projects') },
    { label: 'HR Daily Report',      path: '/staff/hr',          color: '#8b5cf6', icon: '👥', show: hasNavItem('/staff/hr') },
    { label: 'Finance Entry',        path: '/staff/finance',     color: '#2563eb', icon: '💰', show: hasNavItem('/staff/finance') },
    { label: 'Procurement Request',  path: '/staff/procurement', color: '#d97706', icon: '📋', show: hasNavItem('/staff/procurement') },
    { label: 'Compliance Update',    path: '/staff/compliance',  color: '#dc2626', icon: '🔒', show: hasNavItem('/staff/compliance') },
  ].filter(a => a.show)

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: accentColor }} />
              <span className="text-xs font-medium" style={{ color: accentColor }}>Staff Data Entry Portal · {user.entity}</span>
            </div>
            <h2 className="text-xl font-bold text-white">Welcome, {user.name.split(' ')[0]}</h2>
            <p className="text-sm text-slate-400">{today} · Submit today's reports below</p>
          </div>
          <div className="px-5 py-3 rounded-xl text-center" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
            <div className="text-2xl font-bold text-white">{tollToday + projectsToday + hrToday + financeToday + procToday}</div>
            <div className="text-xs" style={{ color: accentColor }}>Submissions Today</div>
          </div>
        </div>
      </div>

      {/* Quick action cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Submit</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              className="p-4 rounded-2xl text-left transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: '#fff', border: `1px solid ${a.color}25` }}>
              <div className="text-3xl mb-3">{a.icon}</div>
              <div className="text-sm font-semibold text-slate-800">{a.label}</div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${a.color}15`, color: a.color }}>
                  + New Entry
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Toll Reports',     count: tollToday,     color: '#f97316', show: hasNavItem('/staff/toll') },
          { label: 'Project Updates',  count: projectsToday, color: '#10b981', show: true },
          { label: 'HR Reports',       count: hrToday,       color: '#8b5cf6', show: true },
          { label: 'Finance Entries',  count: financeToday,  color: '#2563eb', show: true },
          { label: 'Procurement Req.', count: procToday,     color: '#d97706', show: true },
        ].filter(s => s.show).map(s => (
          <div key={s.label} className="p-4 rounded-2xl text-center" style={{ ...card }}>
            <div className="text-2xl font-bold mb-1" style={{ color: s.count > 0 ? s.color : '#94a3b8' }}>{s.count}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className="text-xs mt-0.5" style={{ color: s.count > 0 ? s.color : '#cbd5e1' }}>{s.count > 0 ? 'Submitted' : 'Pending'}</div>
          </div>
        ))}
      </div>

      {/* Recent submissions */}
      <div className="p-5" style={card}>
        <h3 className="font-semibold text-slate-800 mb-4">Recent Submissions</h3>
        <div className="space-y-2">
          {recent.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No submissions yet today. Use Quick Submit above to get started.</p>
          )}
          {recent.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
              style={{ border: '1px solid #f1f5f9' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: accentColor }} />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500">{r.type}</div>
                  <div className="text-sm font-medium text-slate-700 truncate">{r.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-xs text-slate-400">{r.time}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                  style={STATUS_STYLE[r.status] ?? STATUS_STYLE.submitted}>
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reminder banner */}
      <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <span className="text-xl shrink-0">⏰</span>
        <div>
          <div className="text-sm font-semibold text-amber-800">Daily Submission Reminder</div>
          <div className="text-xs text-amber-700 mt-0.5">All daily reports must be submitted before 6:00 PM. Supervisors are notified automatically once you submit. Drafts are saved automatically.</div>
        </div>
      </div>
    </div>
  )
}
