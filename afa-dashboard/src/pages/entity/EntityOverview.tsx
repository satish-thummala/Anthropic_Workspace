import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { ENTITY_DATA } from '../../data/entityData'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const darkCard = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }

const STATUS_COLOR: Record<string, string> = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' }
const ALERT_COLOR: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#94a3b8' }
const STATUS_LABELS: Record<string, string> = { 'on-track': 'On Track', delayed: 'Delayed', overrun: 'Overrun' }
const STATUS_BG: Record<string, string> = { 'on-track': '#f0fdf4', delayed: '#fffbeb', overrun: '#fef2f2' }
const STATUS_TEXT: Record<string, string> = { 'on-track': '#065f46', delayed: '#92400e', overrun: '#991b1b' }
const STATUS_DOT: Record<string, string> = { 'on-track': '#10b981', delayed: '#f59e0b', overrun: '#ef4444' }

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
      <div className="font-semibold text-slate-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-500 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-medium text-slate-800">RM {p.value}M</span>
        </div>
      ))}
    </div>
  )
}

export default function EntityOverview() {
  const user = useSelector((s: RootState) => s.auth.user)
  if (!user) return null

  const data = ENTITY_DATA[user.entityShort]
  if (!data) return <div className="p-8 text-slate-400">No entity data found for {user.entityShort}</div>

  const accentColor = user.entityColor
  const accentBg    = user.entityBg

  const unacked = data.alerts.filter(a => !a.ack).length
  const onTrack = data.projects.filter(p => p.status === 'on-track').length
  const delayed = data.projects.filter(p => p.status === 'delayed').length
  const overrun = data.projects.filter(p => p.status === 'overrun').length

  return (
    <div className="space-y-5">
      {/* Entity banner */}
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: accentColor }} />
              <span className="text-xs font-medium tracking-wide" style={{ color: accentColor }}>LIVE · {user.entity}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{user.entity}</h2>
            <p className="text-sm text-slate-400">{data.tagline} · {new Date().toLocaleDateString('en-MY', { dateStyle: 'full' })}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="text-xl font-bold text-red-400">{unacked}</div>
              <div className="text-xs text-red-300">Active Alerts</div>
            </div>
            <div className="px-4 py-2 rounded-xl text-center" style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}>
              <div className="text-xl font-bold" style={{ color: accentColor }}>{data.complianceScore}%</div>
              <div className="text-xs" style={{ color: accentColor }}>Compliance</div>
            </div>
            <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <div className="text-xl font-bold text-amber-400">{data.pendingApprovals}</div>
              <div className="text-xs text-amber-300">Pending Approvals</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {data.kpis.map(kpi => {
          const isUp = kpi.trend > 0
          const color = STATUS_COLOR[kpi.status]
          return (
            <div key={kpi.label} className="p-4 hover:shadow-md transition-all hover:-translate-y-0.5" style={card}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 leading-tight">{kpi.label}</span>
                <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              </div>
              <div className="text-xl font-bold text-slate-800 leading-tight mb-1">{kpi.value}</div>
              <div className="flex items-center gap-1.5">
                {kpi.trend !== 0 && (
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                    <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
                      {isUp ? <path d="M12 5l7 7H5l7-7z"/> : <path d="M12 19l-7-7h14l-7 7z"/>}
                    </svg>
                    {Math.abs(kpi.trend)}%
                  </span>
                )}
                {kpi.sub && <span className="text-xs text-slate-400">{kpi.sub}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue trend */}
        <div className="xl:col-span-2 p-5" style={card}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Revenue vs Budget Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">{user.entity} · RM Millions · 8-month view</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2 h-2 rounded-full" style={{ background: accentColor }} />Actual</span>
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-300" />Budget</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data.revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="entityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.15}/>
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip />}/>
              <Area type="monotone" dataKey="budget" stroke="#cbd5e1" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" name="Budget"/>
              <Area type="monotone" dataKey="value"  stroke={accentColor} strokeWidth={2.5} fill="url(#entityGrad)" name="Actual"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project summary */}
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-4">Project Status</h3>
          <div className="space-y-3 mb-4">
            {[
              { label: 'On Track', count: onTrack, color: '#10b981', bg: '#f0fdf4' },
              { label: 'Delayed',  count: delayed, color: '#f59e0b', bg: '#fffbeb' },
              { label: 'Overrun',  count: overrun, color: '#ef4444', bg: '#fef2f2' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: s.bg }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-sm text-slate-700 font-medium">{s.label}</span>
                </div>
                <span className="text-xl font-bold" style={{ color: s.color }}>{s.count}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm border-t pt-3" style={{ borderColor: '#f1f5f9' }}>
              <span className="text-slate-500">Workforce</span>
              <span className="font-semibold text-slate-800">{data.headcount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Open Vacancies</span>
              <span className="font-semibold text-amber-600">{data.vacancies}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Pending Approvals</span>
              <span className="font-semibold text-red-500">{data.pendingApprovals}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts + Projects + Deadlines */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Alerts */}
        <div className="p-5" style={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Active Alerts</h3>
            <span className="text-xs px-2 py-1 rounded-full font-semibold text-red-600 bg-red-50">{unacked} open</span>
          </div>
          <div className="space-y-2">
            {data.alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: alert.ack ? '#f8fafc' : `${ALERT_COLOR[alert.severity]}08`, border: `1px solid ${alert.ack ? '#f1f5f9' : ALERT_COLOR[alert.severity] + '25'}`, opacity: alert.ack ? 0.6 : 1 }}>
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: ALERT_COLOR[alert.severity], boxShadow: alert.ack ? 'none' : `0 0 5px ${ALERT_COLOR[alert.severity]}` }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold uppercase" style={{ color: ALERT_COLOR[alert.severity] }}>{alert.severity}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{alert.category}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-tight">{alert.message}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project list */}
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-4">Active Projects</h3>
          <div className="space-y-3">
            {data.projects.map(p => (
              <div key={p.id} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-400">{p.id}</div>
                    <div className="text-xs font-semibold text-slate-700 leading-tight">{p.name}</div>
                  </div>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: STATUS_BG[p.status], color: STATUS_TEXT[p.status] }}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: STATUS_DOT[p.status] }} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 shrink-0">{p.progress}%</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">RM {p.spent}M / RM {p.budget}M · Due {p.dueDate}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Deadlines */}
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {data.upcomingDeadlines.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{ background: d.days <= 5 ? '#fef2f2' : d.days <= 14 ? '#fffbeb' : '#f0fdf4' }}>
                  <div className="text-sm font-black" style={{ color: d.days <= 5 ? '#dc2626' : d.days <= 14 ? '#d97706' : '#16a34a' }}>{d.days}d</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-700 leading-tight">{d.item}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Due: {d.date}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Compliance score */}
          <div className="mt-4 p-4 rounded-xl" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}25` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Compliance Score</span>
              <span className="text-lg font-bold" style={{ color: accentColor }}>{data.complianceScore}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${data.complianceScore}%`, background: accentColor }} />
            </div>
            <div className="text-xs text-slate-400 mt-1">Target: 90%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
