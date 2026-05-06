import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { ENTITY_DATA } from '../../data/entityData'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const darkCard = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }

export default function EntityContracts() {
  const user = useSelector((s: RootState) => s.auth.user)
  if (!user) return null
  const data = ENTITY_DATA[user.entityShort]
  if (!data) return null

  const accentColor = user.entityColor

  // Derive contractor list from projects
  const contractors = Array.from(new Set(data.projects.map(p => p.contractor)))
    .filter(c => c !== 'Internal')
    .map(name => {
      const projs = data.projects.filter(p => p.contractor === name)
      const hasOverrun = projs.some(p => p.status === 'overrun')
      const hasDelay   = projs.some(p => p.status === 'delayed')
      const perf = hasOverrun ? 'poor' : hasDelay ? 'fair' : 'good'
      return { name, projects: projs.length, perf, totalValue: projs.reduce((s, p) => s + p.budget, 0) }
    })

  // Simulated open tenders
  const tenders = [
    { id: 'TND-2025-041', title: `${user.entity} — Annual Maintenance Contract`,   value: 'RM 2.4M', status: 'evaluation', submissions: 4, deadline: 'May 20' },
    { id: 'TND-2025-038', title: `${user.entity} — Supply & Delivery of Equipment`, value: 'RM 890K', status: 'open',       submissions: 2, deadline: 'May 25' },
    { id: 'TND-2025-034', title: `${user.entity} — Professional Services Q3`,       value: 'RM 1.1M', status: 'awarded',   submissions: 6, deadline: 'Closed' },
  ]

  const PERF_STYLES: Record<string, { bg: string; text: string }> = {
    good: { bg: '#f0fdf4', text: '#065f46' },
    fair: { bg: '#fffbeb', text: '#92400e' },
    poor: { bg: '#fef2f2', text: '#991b1b' },
  }
  const TENDER_STYLES: Record<string, { bg: string; text: string }> = {
    open:       { bg: '#eff6ff', text: '#1d4ed8' },
    evaluation: { bg: '#fffbeb', text: '#92400e' },
    awarded:    { bg: '#f0fdf4', text: '#065f46' },
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: accentColor }} />
              <span className="text-xs font-medium" style={{ color: accentColor }}>LIVE · Contracts & Procurement · {user.entity}</span>
            </div>
            <h2 className="text-xl font-bold text-white">Contracts & Tenders</h2>
            <p className="text-sm text-slate-400">Active engagements, contractor performance & open tenders</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Active Contracts',  val: String(contractors.length),   color: accentColor, bg: `${accentColor}20`, border: `${accentColor}40` },
              { label: 'Open Tenders',      val: String(tenders.filter(t => t.status !== 'awarded').length), color: '#2563eb', bg: 'rgba(37,99,235,0.15)', border: 'rgba(37,99,235,0.3)' },
              { label: 'Underperforming',   val: String(contractors.filter(c => c.perf === 'poor').length), color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
            ].map(s => (
              <div key={s.label} className="px-4 py-2 rounded-xl text-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs" style={{ color: s.color }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contractor performance */}
      {contractors.length > 0 && (
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-4">Contractor Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contractors.map(c => (
              <div key={c.name} className="p-4 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.projects} project{c.projects !== 1 ? 's' : ''} · RM {c.totalValue.toFixed(1)}M</div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                    style={PERF_STYLES[c.perf]}>
                    {c.perf}
                  </span>
                </div>
                {/* Projects under this contractor */}
                <div className="space-y-1.5">
                  {data.projects.filter(p => p.contractor === c.name).map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: p.status === 'on-track' ? '#10b981' : p.status === 'delayed' ? '#f59e0b' : '#ef4444' }} />
                      <span className="text-slate-600 truncate">{p.name}</span>
                      <span className="ml-auto text-slate-400 shrink-0">{p.progress}%</span>
                    </div>
                  ))}
                </div>
                {c.perf === 'poor' && (
                  <div className="mt-3 text-xs font-semibold text-red-600 px-2 py-1 rounded-lg" style={{ background: '#fef2f2' }}>
                    ⚠ Performance review required
                  </div>
                )}
              </div>
            ))}
            {contractors.length === 0 && (
              <div className="col-span-3 p-6 text-center text-slate-400 text-sm">
                All projects are delivered internally — no external contractors.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tenders */}
      <div className="p-5" style={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Tenders & Procurement</h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Tender
          </button>
        </div>
        <div className="space-y-3">
          {tenders.map(t => (
            <div key={t.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors"
              style={{ border: '1px solid #f1f5f9' }}>
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-slate-400">{t.id}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                    style={TENDER_STYLES[t.status]}>{t.status}</span>
                </div>
                <div className="text-sm font-medium text-slate-700">{t.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{t.submissions} submission{t.submissions !== 1 ? 's' : ''} · Deadline: {t.deadline}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-slate-800">{t.value}</div>
                <button className="text-xs text-blue-500 hover:text-blue-700 mt-1">View →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
