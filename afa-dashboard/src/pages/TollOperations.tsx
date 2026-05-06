import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis } from 'recharts'
import { TOLL_PLAZAS, HOURLY_TRAFFIC, TRAFFIC_REVENUE_CORR } from '../data/mockData'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const darkCard = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }

const CONGESTION_COLOR: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }
const CONGESTION_BG: Record<string, string> = { high: 'rgba(239,68,68,0.1)', medium: 'rgba(245,158,11,0.1)', low: 'rgba(16,185,129,0.1)' }

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
      <div className="font-semibold text-slate-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-500 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="text-slate-800 font-medium">{typeof p.value === 'number' && p.value > 1000 ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function TollOperations() {
  const totalVehicles = TOLL_PLAZAS.reduce((s, p) => s + p.volume, 0)
  const totalRevenue = TOLL_PLAZAS.reduce((s, p) => s + p.revenue, 0)
  const highCongestion = TOLL_PLAZAS.filter(p => p.congestion === 'high').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse-slow" />
              <span className="text-xs text-blue-400 font-medium">LIVE · Toll SCADA · 7 Plazas Active</span>
            </div>
            <h2 className="text-xl font-bold text-white">Toll Operations Intelligence</h2>
            <p className="text-sm text-slate-400">Real-time traffic, revenue, and congestion monitoring</p>
          </div>
          <div className="flex gap-3">
            <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <div className="text-xl font-bold text-blue-400">{totalVehicles.toLocaleString()}</div>
              <div className="text-xs text-blue-300">Vehicles Today</div>
            </div>
            <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div className="text-xl font-bold text-emerald-400">RM {totalRevenue.toFixed(1)}M</div>
              <div className="text-xs text-emerald-300">Revenue Today</div>
            </div>
            <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="text-xl font-bold text-red-400">{highCongestion}</div>
              <div className="text-xs text-red-300">High Congestion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Plaza Heatmap */}
      <div className="p-5" style={card}>
        <h3 className="font-semibold text-slate-800 mb-1">Plaza Status Heatmap</h3>
        <p className="text-xs text-slate-400 mb-4">Real-time vehicle volume, revenue, and congestion per plaza</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {TOLL_PLAZAS.map(plaza => (
            <div key={plaza.id} className="p-4 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: CONGESTION_BG[plaza.congestion], border: `1.5px solid ${CONGESTION_COLOR[plaza.congestion]}30` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-slate-800 leading-tight">{plaza.name}</div>
                  <div className="text-xs text-slate-500">{plaza.location} · {plaza.id}</div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  style={{ background: CONGESTION_COLOR[plaza.congestion] + '20', color: CONGESTION_COLOR[plaza.congestion] }}>
                  {plaza.congestion}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-lg font-bold text-slate-800">{plaza.volume.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">vehicles</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800">RM{plaza.revenue}M</div>
                  <div className="text-xs text-slate-500">revenue</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${plaza.trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {plaza.trend > 0 ? '↑' : '↓'} {Math.abs(plaza.trend)}%
                </span>
                <span className="text-xs text-slate-400">vs yesterday</span>
              </div>
              {/* Mini bar */}
              <div className="mt-2 h-1.5 rounded-full bg-white/50 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(plaza.volume / 45000) * 100}%`, background: CONGESTION_COLOR[plaza.congestion] }} />
              </div>
            </div>
          ))}
          {/* Summary card */}
          <div className="p-4 rounded-xl flex flex-col justify-center items-center text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="text-3xl font-black text-slate-800">7</div>
            <div className="text-sm font-semibold text-slate-600">Active Plazas</div>
            <div className="mt-3 space-y-1 w-full">
              {['high','medium','low'].map(c => (
                <div key={c} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500"><span className="w-1.5 h-1.5 rounded-full" style={{ background: CONGESTION_COLOR[c] }} />{c}</span>
                  <span className="font-semibold text-slate-700">{TOLL_PLAZAS.filter(p => p.congestion === c).length}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Hourly traffic */}
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-1">Hourly Vehicle Volume</h3>
          <p className="text-xs text-slate-400 mb-4">All plazas combined · Today</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={HOURLY_TRAFFIC.filter((_, i) => i % 2 === 0)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip />}/>
              <Bar dataKey="vehicles" fill="#2563eb" radius={[3,3,0,0]} name="Vehicles" opacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Traffic correlation */}
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-1">Revenue vs Traffic Correlation</h3>
          <p className="text-xs text-slate-400 mb-4">Per plaza · Today</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TRAFFIC_REVENUE_CORR} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="plaza" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="left" orientation="left" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip />}/>
              <Bar yAxisId="left" dataKey="traffic" fill="#2563eb" radius={[3,3,0,0]} name="Vehicles" opacity={0.7}/>
              <Bar yAxisId="right" dataKey="revenue" fill="#10b981" radius={[3,3,0,0]} name="Revenue (RM M)" opacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Congestion Alerts */}
      <div className="p-5" style={card}>
        <h3 className="font-semibold text-slate-800 mb-4">Congestion & Operational Alerts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { plaza: 'Plaza Sg. Besi', alert: 'High congestion · Lane 3-4 bottleneck · ETA impact +12min', severity: 'high', action: 'Dispatch traffic officer' },
            { plaza: 'Plaza Skudai', alert: 'Peak volume exceeding capacity · 38,920 vehicles today', severity: 'high', action: 'Activate overflow lane' },
            { plaza: 'Plaza Pagoh', alert: 'SCADA heartbeat delay 14min · Revenue data gap possible', severity: 'medium', action: 'Check connectivity' },
          ].map(a => (
            <div key={a.plaza} className="p-4 rounded-xl" style={{ background: a.severity === 'high' ? '#fef2f2' : '#fffbeb', border: `1px solid ${a.severity === 'high' ? '#fecaca' : '#fde68a'}` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: a.severity === 'high' ? '#ef4444' : '#f59e0b' }} />
                <span className="text-sm font-bold text-slate-800">{a.plaza}</span>
              </div>
              <p className="text-xs text-slate-600 mb-2">{a.alert}</p>
              <p className="text-xs font-semibold" style={{ color: a.severity === 'high' ? '#dc2626' : '#d97706' }}>→ {a.action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
