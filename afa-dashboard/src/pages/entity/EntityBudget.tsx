import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { ENTITY_DATA } from '../../data/entityData'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const darkCard = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }

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

export default function EntityBudget() {
  const user = useSelector((s: RootState) => s.auth.user)
  if (!user) return null
  const data = ENTITY_DATA[user.entityShort]
  if (!data) return null

  const accentColor = user.entityColor
  const totalBudget = data.projects.reduce((s, p) => s + p.budget, 0)
  const totalSpent  = data.projects.reduce((s, p) => s + p.spent, 0)
  const remaining   = totalBudget - totalSpent
  const utilPct     = ((totalSpent / totalBudget) * 100).toFixed(1)

  const latestMonth = data.revenueData[data.revenueData.length - 1]
  const prevMonth   = data.revenueData[data.revenueData.length - 2]
  const monthlyTrend = latestMonth && prevMonth
    ? (((latestMonth.value - prevMonth.value) / prevMonth.value) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: accentColor }} />
              <span className="text-xs font-medium" style={{ color: accentColor }}>LIVE · Finance & Treasury · {user.entity}</span>
            </div>
            <h2 className="text-xl font-bold text-white">Budget & Finance</h2>
            <p className="text-sm text-slate-400">Revenue performance, budget utilisation & financial health</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Total Budget', val: `RM ${totalBudget.toFixed(0)}M`, color: '#2563eb', bg: 'rgba(37,99,235,0.15)', border: 'rgba(37,99,235,0.3)' },
              { label: 'Spent',        val: `RM ${totalSpent.toFixed(0)}M`,  color: totalSpent > totalBudget ? '#ef4444' : '#10b981', bg: totalSpent > totalBudget ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: totalSpent > totalBudget ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)' },
              { label: 'Remaining',    val: `RM ${Math.abs(remaining).toFixed(0)}M`, color: remaining >= 0 ? '#10b981' : '#ef4444', bg: remaining >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: remaining >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' },
            ].map(s => (
              <div key={s.label} className="px-4 py-2 rounded-xl text-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs" style={{ color: s.color }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Budget Utilisation', value: `${utilPct}%`, note: `${utilPct > '90' ? 'Near limit' : 'On track'}`, color: parseFloat(utilPct) > 95 ? '#ef4444' : parseFloat(utilPct) > 85 ? '#f59e0b' : '#10b981' },
          { label: 'Latest Month Revenue', value: `RM ${latestMonth?.value}M`, note: `${monthlyTrend}% vs prev month`, color: parseFloat(monthlyTrend) >= 0 ? '#10b981' : '#ef4444' },
          { label: 'Budget vs Actual', value: `${remaining >= 0 ? '+' : ''}RM ${remaining.toFixed(1)}M`, note: remaining >= 0 ? 'Within budget' : 'Over budget', color: remaining >= 0 ? '#10b981' : '#ef4444' },
          { label: 'Pending Approvals', value: String(data.pendingApprovals), note: 'awaiting sign-off', color: data.pendingApprovals > 5 ? '#ef4444' : '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="p-4" style={card}>
            <div className="text-xs text-slate-400 mb-2">{k.label}</div>
            <div className="text-2xl font-bold mb-1" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-slate-400">{k.note}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-1">Revenue vs Budget — Monthly</h3>
          <p className="text-xs text-slate-400 mb-4">{user.entity} · RM Millions</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip />}/>
              <Bar dataKey="budget" fill="#e2e8f0" radius={[3,3,0,0]} name="Budget" />
              <Bar dataKey="value"  fill={accentColor} radius={[3,3,0,0]} name="Actual" opacity={0.9}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-1">Revenue Trend</h3>
          <p className="text-xs text-slate-400 mb-4">8-month rolling · {user.entity}</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip />}/>
              <Line type="monotone" dataKey="budget" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Budget"/>
              <Line type="monotone" dataKey="value"  stroke={accentColor} strokeWidth={2.5} dot={false} name="Actual"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project budget breakdown */}
      <div className="p-5" style={card}>
        <h3 className="font-semibold text-slate-800 mb-4">Project Budget Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left px-3 py-2.5 font-medium">Project</th>
                <th className="text-right px-3 py-2.5 font-medium">Budget (RM M)</th>
                <th className="text-right px-3 py-2.5 font-medium">Spent (RM M)</th>
                <th className="text-right px-3 py-2.5 font-medium">Utilisation</th>
                <th className="text-left px-3 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p, i) => {
                const util = ((p.spent / p.budget) * 100).toFixed(0)
                const over  = p.spent > p.budget
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors"
                    style={{ borderBottom: i < data.projects.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <td className="px-3 py-3">
                      <div className="text-xs font-bold text-slate-400">{p.id}</div>
                      <div className="text-sm font-medium text-slate-700">{p.name}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-700">{p.budget}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-semibold" style={{ color: over ? '#ef4444' : '#10b981' }}>{p.spent}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(parseFloat(util), 100)}%`, background: over ? '#ef4444' : accentColor }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: over ? '#ef4444' : '#64748b' }}>{util}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: over ? '#fef2f2' : '#f0fdf4', color: over ? '#991b1b' : '#065f46' }}>
                        {over ? `Overrun +${((p.spent - p.budget) / p.budget * 100).toFixed(1)}%` : 'Within Budget'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
