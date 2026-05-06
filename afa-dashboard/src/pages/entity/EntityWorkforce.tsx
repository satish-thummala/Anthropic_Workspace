import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { ENTITY_DATA } from '../../data/entityData'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const darkCard = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }

export default function EntityWorkforce() {
  const user = useSelector((s: RootState) => s.auth.user)
  if (!user) return null
  const data = ENTITY_DATA[user.entityShort]
  if (!data) return null

  const accentColor = user.entityColor
  const available   = data.headcount - data.vacancies
  const availPct    = ((available / data.headcount) * 100).toFixed(0)

  const hrAlerts = data.alerts.filter(a => a.category === 'HR')

  // Simulated role breakdown based on entity type
  const getRoleBreakdown = () => {
    const entityShort = user.entityShort
    if (entityShort === 'AFA PM' || entityShort === 'C&E' || entityShort === 'INFRA') {
      return [
        { role: 'Project Engineers',       count: Math.round(data.headcount * 0.35), pct: 35 },
        { role: 'Site Supervisors',         count: Math.round(data.headcount * 0.25), pct: 25 },
        { role: 'Contract & Procurement',   count: Math.round(data.headcount * 0.12), pct: 12 },
        { role: 'Finance & Admin',          count: Math.round(data.headcount * 0.10), pct: 10 },
        { role: 'Safety & Compliance',      count: Math.round(data.headcount * 0.08), pct: 8 },
        { role: 'Others',                   count: Math.round(data.headcount * 0.10), pct: 10 },
      ]
    }
    if (entityShort === 'SYSTEMS') {
      return [
        { role: 'IT Engineers',             count: Math.round(data.headcount * 0.38), pct: 38 },
        { role: 'Toll Operations',           count: Math.round(data.headcount * 0.30), pct: 30 },
        { role: 'Network & Security',        count: Math.round(data.headcount * 0.15), pct: 15 },
        { role: 'Project Management',        count: Math.round(data.headcount * 0.10), pct: 10 },
        { role: 'Admin & Support',           count: Math.round(data.headcount * 0.07), pct: 7 },
      ]
    }
    if (entityShort === 'PRIME' || entityShort === 'PROP' || entityShort === 'TERRA') {
      return [
        { role: 'Technical / Professional',  count: Math.round(data.headcount * 0.42), pct: 42 },
        { role: 'Finance & Treasury',         count: Math.round(data.headcount * 0.18), pct: 18 },
        { role: 'Compliance & Legal',         count: Math.round(data.headcount * 0.15), pct: 15 },
        { role: 'Operations',                 count: Math.round(data.headcount * 0.15), pct: 15 },
        { role: 'Admin & HR',                 count: Math.round(data.headcount * 0.10), pct: 10 },
      ]
    }
    return [
      { role: 'Operations',  count: Math.round(data.headcount * 0.45), pct: 45 },
      { role: 'Technical',   count: Math.round(data.headcount * 0.30), pct: 30 },
      { role: 'Support',     count: Math.round(data.headcount * 0.15), pct: 15 },
      { role: 'Management',  count: Math.round(data.headcount * 0.10), pct: 10 },
    ]
  }

  const roles = getRoleBreakdown()

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: accentColor }} />
              <span className="text-xs font-medium" style={{ color: accentColor }}>LIVE · Workforce Management · {user.entity}</span>
            </div>
            <h2 className="text-xl font-bold text-white">Workforce Overview</h2>
            <p className="text-sm text-slate-400">Headcount, availability, vacancies & attrition monitoring</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Total Headcount', val: data.headcount.toLocaleString(), color: accentColor, bg: `${accentColor}20`, border: `${accentColor}40` },
              { label: 'Deployed',        val: available.toLocaleString(),       color: '#10b981',   bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
              { label: 'Open Vacancies',  val: String(data.vacancies),           color: '#f59e0b',   bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
            ].map(s => (
              <div key={s.label} className="px-4 py-2 rounded-xl text-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs" style={{ color: s.color }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Availability gauge */}
        <div className="p-5 flex flex-col" style={card}>
          <h3 className="font-semibold text-slate-800 mb-4">Deployment Status</h3>
          <div className="flex items-center justify-center flex-1 mb-4">
            <svg width="160" height="90" viewBox="0 0 160 90">
              <path d="M 10 85 A 70 70 0 0 1 150 85" fill="none" stroke="#f1f5f9" strokeWidth="14" strokeLinecap="round"/>
              <path d="M 10 85 A 70 70 0 0 1 150 85" fill="none" stroke={accentColor} strokeWidth="14" strokeLinecap="round"
                strokeDasharray={`${(parseFloat(availPct) / 100) * 220} 220`}/>
              <text x="80" y="76" textAnchor="middle" fontSize="24" fontWeight="800" fill="#1e293b">{availPct}%</text>
            </svg>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Deployed / Active',   val: available.toLocaleString(),   color: accentColor },
              { label: 'Open Vacancies',       val: data.vacancies,               color: '#f59e0b' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: '#f8fafc' }}>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                  {r.label}
                </div>
                <span className="font-bold text-sm" style={{ color: r.color }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role breakdown */}
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-4">Workforce by Role</h3>
          <div className="space-y-3">
            {roles.map(r => (
              <div key={r.role}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">{r.role}</span>
                  <span className="text-slate-700 font-semibold">{r.count} ({r.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, background: accentColor }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vacancy & alerts */}
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-4">Vacancy & HR Alerts</h3>
          {hrAlerts.length > 0 ? (
            <div className="space-y-3 mb-4">
              {hrAlerts.map(a => (
                <div key={a.id} className="p-3 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs font-bold text-red-700 uppercase">{a.severity}</span>
                  </div>
                  <p className="text-xs text-slate-700">{a.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{a.time}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl mb-4 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div className="text-2xl mb-1">✓</div>
              <p className="text-sm font-semibold text-emerald-700">No HR alerts</p>
              <p className="text-xs text-emerald-600">Attrition within threshold</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="p-3 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <div className="text-xs font-bold text-amber-700 mb-1">Open Vacancies: {data.vacancies}</div>
              <p className="text-xs text-slate-600">Unfilled positions may impact project delivery timelines.</p>
              <button className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                → Submit hiring request
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workforce health summary */}
      <div className="p-5" style={card}>
        <h3 className="font-semibold text-slate-800 mb-4">Workforce Health Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Headcount',       value: data.headcount.toLocaleString(), status: 'green',  note: 'Full-time employees' },
            { label: 'Deployed',        value: `${availPct}%`,                  status: 'green',  note: 'Active & on-site' },
            { label: 'Open Vacancies',  value: String(data.vacancies),          status: data.vacancies > 20 ? 'red' : 'yellow', note: 'Positions to fill' },
            { label: 'Compliance Score', value: `${data.complianceScore}%`,     status: data.complianceScore >= 90 ? 'green' : 'yellow', note: 'Target: 90%' },
          ].map(s => {
            const color = s.status === 'green' ? '#10b981' : s.status === 'yellow' ? '#f59e0b' : '#ef4444'
            const bg    = s.status === 'green' ? '#f0fdf4' : s.status === 'yellow' ? '#fffbeb' : '#fef2f2'
            return (
              <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: bg }}>
                <div className="text-2xl font-bold mb-1" style={{ color }}>{s.value}</div>
                <div className="text-sm font-semibold text-slate-700">{s.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.note}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
