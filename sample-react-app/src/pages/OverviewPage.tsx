import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const revenueData = [
  { month: 'Jan', revenue: 4.2, target: 4.0 },
  { month: 'Feb', revenue: 4.8, target: 4.5 },
  { month: 'Mar', revenue: 5.1, target: 4.8 },
  { month: 'Apr', revenue: 4.7, target: 5.0 },
  { month: 'May', revenue: 5.8, target: 5.2 },
  { month: 'Jun', revenue: 6.2, target: 5.5 },
  { month: 'Jul', revenue: 6.8, target: 6.0 },
  { month: 'Aug', revenue: 7.1, target: 6.5 },
]

const trafficData = [
  { day: 'Mon', users: 2400 },
  { day: 'Tue', users: 3200 },
  { day: 'Wed', users: 2800 },
  { day: 'Thu', users: 3800 },
  { day: 'Fri', users: 4200 },
  { day: 'Sat', users: 2900 },
  { day: 'Sun', users: 2100 },
]

const KPI_CARDS = [
  { label: 'Total Revenue', value: '$7.1M', change: '+18.2%', up: true, sub: 'vs last quarter', color: '#6366f1' },
  { label: 'Active Users', value: '94,832', change: '+12.4%', up: true, sub: 'vs last month', color: '#10b981' },
  { label: 'Conversion Rate', value: '3.82%', change: '+0.4%', up: true, sub: 'vs last month', color: '#f59e0b' },
  { label: 'Churn Rate', value: '1.24%', change: '-0.2%', up: false, sub: 'vs last month', color: '#ef4444' },
]

const RECENT_ACTIVITY = [
  { user: 'Sarah K.', action: 'Upgraded to Enterprise plan', time: '2m ago', dot: '#6366f1' },
  { user: 'James L.', action: 'Submitted Q3 report', time: '14m ago', dot: '#10b981' },
  { user: 'Maya P.', action: 'Invited 3 new team members', time: '1h ago', dot: '#f59e0b' },
  { user: 'Tom R.', action: 'Cancelled subscription', time: '2h ago', dot: '#ef4444' },
  { user: 'Lena S.', action: 'Created new project workspace', time: '3h ago', dot: '#6366f1' },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-sm shadow-lg" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
      <div className="font-semibold text-slate-800 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-500">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="text-slate-800 font-medium">{typeof p.value === 'number' && p.value < 20 ? `$${p.value}M` : p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16 }

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_CARDS.map(c => (
          <div key={c.label} className="p-5 transition-all hover:shadow-md hover:-translate-y-0.5" style={cardStyle}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm text-slate-500 font-medium">{c.label}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.up ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>{c.change}</span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{c.value}</div>
            <div className="text-xs text-slate-400">{c.sub}</div>
            <div className="mt-4 h-1 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: '65%', background: c.color, opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-800">Revenue vs Target</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly comparison (USD millions)</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />Revenue</span>
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" />Target</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="target" stroke="#cbd5e1" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" name="Target" />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#rev)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="p-5" style={cardStyle}>
          <div className="mb-5">
            <h3 className="font-semibold text-slate-800">Daily Active Users</h3>
            <p className="text-xs text-slate-400 mt-0.5">This week</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trafficData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} name="Users" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 p-5" style={cardStyle}>
          <h3 className="font-semibold text-slate-800 mb-4">Recent Activity</h3>
          <div className="space-y-1">
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b last:border-0" style={{ borderColor: '#f1f5f9' }}>
                <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: item.dot }} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700">{item.user}</span>
                  <span className="text-sm text-slate-400"> {item.action}</span>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5" style={cardStyle}>
          <h3 className="font-semibold text-slate-800 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            {[
              { label: 'Avg Session Duration', value: '4m 32s', pct: 72 },
              { label: 'Page Views Today', value: '128,400', pct: 58 },
              { label: 'Support Tickets', value: '24 open', pct: 30 },
              { label: 'System Uptime', value: '99.97%', pct: 99 },
            ].map(stat => (
              <div key={stat.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500">{stat.label}</span>
                  <span className="text-slate-800 font-medium">{stat.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${stat.pct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
