import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { ENTITY_DATA } from '../../data/entityData'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const darkCard = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }

const STATUS_LABELS: Record<string, string> = { 'on-track': 'On Track', delayed: 'Delayed', overrun: 'Overrun' }
const STATUS_BG: Record<string, string>     = { 'on-track': '#f0fdf4', delayed: '#fffbeb', overrun: '#fef2f2' }
const STATUS_TEXT: Record<string, string>   = { 'on-track': '#065f46', delayed: '#92400e', overrun: '#991b1b' }
const STATUS_DOT: Record<string, string>    = { 'on-track': '#10b981', delayed: '#f59e0b', overrun: '#ef4444' }

export default function EntityProjects() {
  const user = useSelector((s: RootState) => s.auth.user)
  if (!user) return null
  const data = ENTITY_DATA[user.entityShort]
  if (!data) return null

  const accentColor = user.entityColor
  const onTrack = data.projects.filter(p => p.status === 'on-track').length
  const delayed  = data.projects.filter(p => p.status === 'delayed').length
  const overrun  = data.projects.filter(p => p.status === 'overrun').length
  const totalBudget = data.projects.reduce((s, p) => s + p.budget, 0)
  const totalSpent  = data.projects.reduce((s, p) => s + p.spent, 0)

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: accentColor }} />
              <span className="text-xs font-medium" style={{ color: accentColor }}>LIVE · Project Management · {user.entity}</span>
            </div>
            <h2 className="text-xl font-bold text-white">Project Portfolio</h2>
            <p className="text-sm text-slate-400">{data.projects.length} active projects · Real-time budget & schedule tracking</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'On Track', val: onTrack, color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
              { label: 'Delayed',  val: delayed,  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
              { label: 'Overrun',  val: overrun,  color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.3)' },
            ].map(s => (
              <div key={s.label} className="px-4 py-2 rounded-xl text-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs" style={{ color: s.color }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects',    value: String(data.projects.length), color: accentColor },
          { label: 'Total Budget',      value: `RM ${totalBudget.toFixed(1)}M`, color: '#2563eb' },
          { label: 'Total Spent',       value: `RM ${totalSpent.toFixed(1)}M`, color: totalSpent > totalBudget ? '#ef4444' : '#10b981' },
          { label: 'Budget Utilisation', value: `${((totalSpent / totalBudget) * 100).toFixed(1)}%`, color: totalSpent > totalBudget ? '#ef4444' : '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="p-4" style={card}>
            <div className="text-xs text-slate-400 mb-2">{k.label}</div>
            <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.projects.map(p => {
          const overrunPct = p.spent > p.budget ? ((p.spent - p.budget) / p.budget * 100).toFixed(1) : null
          return (
            <div key={p.id} className="p-5 hover:shadow-md transition-all" style={card}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-0.5">{p.id} · {p.region}</div>
                  <div className="text-base font-bold text-slate-800 leading-tight">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Contractor: {p.contractor} · Due: {p.dueDate}</div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                  style={{ background: STATUS_BG[p.status], color: STATUS_TEXT[p.status] }}>
                  {STATUS_LABELS[p.status]}
                  {p.delay > 0 && ` +${p.delay}d`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-semibold text-slate-700">{p.progress}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${p.progress}%`, background: STATUS_DOT[p.status] }} />
                </div>
              </div>

              {/* Budget */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Budget Usage</span>
                  <span className="font-semibold" style={{ color: p.spent > p.budget ? '#ef4444' : '#10b981' }}>
                    RM {p.spent}M / RM {p.budget}M
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min((p.spent / p.budget) * 100, 100)}%`, background: p.spent > p.budget ? '#ef4444' : accentColor }} />
                </div>
              </div>

              {overrunPct && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-700"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  ⚠ Budget overrun: +{overrunPct}% · Director approval required
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
