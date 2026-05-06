import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { GROUP_KPIS, REVENUE_TREND, CRITICAL_ALERTS, SYSTEM_STATUS, PENDING_APPROVALS, INTEGRATION_SOURCES } from '../data/mockData'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const darkCard = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }

const STATUS_COLOR: Record<string, string> = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' }
const STATUS_BG: Record<string, string> = { green: '#f0fdf4', yellow: '#fffbeb', red: '#fef2f2' }
const STATUS_TEXT: Record<string, string> = { green: '#065f46', yellow: '#92400e', red: '#991b1b' }

const ALERT_COLOR: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#94a3b8' }

function KpiCard({ label, value, trend, status, sub }: any) {
  const isUp = trend > 0
  const color = STATUS_COLOR[status]
  return (
    <div className="p-4 hover:shadow-md transition-all hover:-translate-y-0.5" style={card}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 leading-tight">{label}</span>
        <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <div className="text-2xl font-bold text-slate-800 leading-tight mb-1">{value}</div>
      <div className="flex items-center gap-1.5">
        {trend !== 0 && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
            <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
              {isUp ? <path d="M12 5l7 7H5l7-7z"/> : <path d="M12 19l-7-7h14l-7 7z"/>}
            </svg>
            {Math.abs(trend)}%
          </span>
        )}
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
      </div>
    </div>
  )
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs shadow-xl" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
      <div className="font-semibold text-slate-700 mb-1.5">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-500 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}:</span> <span className="text-slate-800 font-medium">RM {p.value}M</span>
        </div>
      ))}
    </div>
  )
}

export default function ExecutiveDashboard() {
  const k = GROUP_KPIS
  const unackedAlerts = CRITICAL_ALERTS.filter(a => !a.ack).length

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4" style={darkCard}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-xs text-emerald-400 font-medium tracking-wide">LIVE · SAP · Oracle · Toll SCADA · HR · DW</span>
          </div>
          <h2 className="text-xl font-bold text-white">Group Executive Dashboard</h2>
          <p className="text-sm text-slate-400">AFA Group Holdings · FY2025 · As of {new Date().toLocaleDateString('en-MY', { dateStyle: 'full' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="text-2xl font-bold text-red-400">{unackedAlerts}</div>
            <div className="text-xs text-red-300">Unacked Alerts</div>
          </div>
          <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <div className="text-2xl font-bold text-blue-400">87%</div>
            <div className="text-xs text-blue-300">Compliance Score</div>
          </div>
          <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="text-2xl font-bold text-amber-400">GUARDED</div>
            <div className="text-xs text-amber-300">Cyber Posture</div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <KpiCard label="Total Revenue" value={k.totalRevenue.value} trend={k.totalRevenue.trend} status={k.totalRevenue.status} sub="YTD" />
        <KpiCard label="Toll Revenue" value={k.tollRevenue.value} trend={k.tollRevenue.trend} status={k.tollRevenue.status} sub="YTD" />
        <KpiCard label="Active Projects" value={k.projectsActive.value} trend={k.projectsActive.trend} status={k.projectsActive.status} sub="38 total" />
        <KpiCard label="Workforce" value={k.workforce.value} trend={k.workforce.trend} status={k.workforce.status} sub="headcount" />
        <KpiCard label="Procurement Spend" value={k.procurementSpend.value} trend={k.procurementSpend.trend} status={k.procurementSpend.status} sub="YTD" />
        <KpiCard label="Open Risks" value={k.openRisks.value} trend={k.openRisks.trend} status={k.openRisks.status} sub="3 critical" />
        <KpiCard label="Compliance Score" value={k.complianceScore.value} trend={k.complianceScore.trend} status={k.complianceScore.status} sub="target 92%" />
        <KpiCard label="Cyber Posture" value={k.cyberStatus.value} trend={0} status={k.cyberStatus.status} sub="risk: 42/100" />
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue trend */}
        <div className="xl:col-span-2 p-5" style={card}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Group Revenue Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Multi-stream · 11-month rolling · RM Millions</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {[{c:'#2563eb',l:'Toll'},{c:'#10b981',l:'Construction'},{c:'#f59e0b',l:'Property'},{c:'#8b5cf6',l:'Services'}].map(x => (
                <span key={x.l} className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full" style={{ background: x.c }} />{x.l}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_TREND} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                {[{id:'toll',c:'#2563eb'},{id:'cons',c:'#10b981'},{id:'prop',c:'#f59e0b'},{id:'svc',c:'#8b5cf6'}].map(g => (
                  <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={g.c} stopOpacity={0.15}/>
                    <stop offset="100%" stopColor={g.c} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip />}/>
              <Area type="monotone" dataKey="toll" stroke="#2563eb" strokeWidth={2.5} fill="url(#toll)" name="Toll"/>
              <Area type="monotone" dataKey="construction" stroke="#10b981" strokeWidth={2} fill="url(#cons)" name="Construction"/>
              <Area type="monotone" dataKey="property" stroke="#f59e0b" strokeWidth={2} fill="url(#prop)" name="Property"/>
              <Area type="monotone" dataKey="services" stroke="#8b5cf6" strokeWidth={2} fill="url(#svc)" name="Services"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Integration status */}
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-1">Integration Layer</h3>
          <p className="text-xs text-slate-400 mb-4">Live system connectivity</p>
          <div className="space-y-2.5">
            {INTEGRATION_SOURCES.map(src => (
              <div key={src.name} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: src.status === 'live' ? '#10b981' : '#f59e0b', boxShadow: `0 0 6px ${src.status === 'live' ? '#10b981' : '#f59e0b'}` }} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-700 truncate">{src.name}</div>
                    <div className="text-xs text-slate-400 truncate">{src.module}</div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-xs font-medium text-slate-600">{src.lastSync}</div>
                  <div className="text-xs text-slate-400">{src.records.toLocaleString()} rec</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts + Approvals + System status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Critical Alerts */}
        <div className="xl:col-span-2 p-5" style={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Active Alerts</h3>
            <span className="text-xs px-2 py-1 rounded-full font-semibold text-red-600 bg-red-50">{unackedAlerts} unacknowledged</span>
          </div>
          <div className="space-y-2">
            {CRITICAL_ALERTS.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-slate-50"
                style={{ border: `1px solid ${alert.ack ? '#f1f5f9' : `${ALERT_COLOR[alert.severity]}25`}`, opacity: alert.ack ? 0.6 : 1 }}>
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: ALERT_COLOR[alert.severity], boxShadow: alert.ack ? 'none' : `0 0 6px ${ALERT_COLOR[alert.severity]}` }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: ALERT_COLOR[alert.severity] }}>{alert.severity}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded text-slate-500" style={{ background: '#f1f5f9' }}>{alert.category}</span>
                    {alert.ack && <span className="text-xs text-slate-400">· Acknowledged</span>}
                  </div>
                  <p className="text-sm text-slate-700 leading-tight">{alert.message}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-4">System Health</h3>
          <div className="space-y-2">
            {SYSTEM_STATUS.map(sys => (
              <div key={sys.system} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: '#f8fafc' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: sys.status === 'online' ? '#10b981' : '#f59e0b', boxShadow: `0 0 5px ${sys.status === 'online' ? '#10b981' : '#f59e0b'}` }} />
                  <span className="text-xs text-slate-600 truncate">{sys.system}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-xs font-semibold" style={{ color: sys.status === 'online' ? '#10b981' : '#f59e0b' }}>{sys.uptime}</div>
                  <div className="text-xs text-slate-400">{sys.latency}ms</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="p-5" style={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Pending Approvals</h3>
          <span className="text-xs px-2 py-1 rounded-full text-amber-700 bg-amber-50 font-semibold">{PENDING_APPROVALS.length} pending action</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PENDING_APPROVALS.map(a => (
            <div key={a.id} className="p-3.5 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-700">{a.id}</span>
                <span className="text-xs text-slate-500">{a.age}h pending</span>
              </div>
              <p className="text-xs text-slate-700 font-medium mb-1 leading-tight">{a.description}</p>
              <p className="text-xs text-slate-500">Requested by {a.requestedBy} · {a.dept}</p>
              <div className="mt-2 pt-2 border-t border-amber-200">
                <span className="text-xs font-semibold text-amber-800">⏳ {a.pending}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
