import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { CYBER_METRICS, THREAT_TIMELINE, SECURITY_INCIDENTS, ENDPOINT_STATUS } from '../data/mockData'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const darkCard = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  high:   { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  medium: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  low:    { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' },
}

const INCIDENT_STATUS_STYLES: Record<string, { text: string; bg: string }> = {
  investigating: { text: '#dc2626', bg: '#fef2f2' },
  contained:     { text: '#d97706', bg: '#fffbeb' },
  resolved:      { text: '#16a34a', bg: '#f0fdf4' },
}

function RiskGauge({ score }: { score: number }) {
  const color = score < 30 ? '#10b981' : score < 60 ? '#f59e0b' : '#ef4444'
  const label = score < 30 ? 'LOW' : score < 60 ? 'GUARDED' : 'ELEVATED'
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round"/>
        <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 188} 188`} style={{ transition: 'stroke-dasharray 1s ease' }}/>
        <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#1e293b">{score}</text>
      </svg>
      <div className="text-sm font-bold mt-1" style={{ color }}>{label}</div>
      <div className="text-xs text-slate-400">Risk Score / 100</div>
    </div>
  )
}

const chartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
      <div className="font-semibold text-slate-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-500">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="text-slate-800 font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function CyberSecurity() {
  const m = CYBER_METRICS

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-slow" />
              <span className="text-xs text-amber-400 font-medium">LIVE · Cybersecurity Stack · Simulated Feed</span>
            </div>
            <h2 className="text-xl font-bold text-white">Cybersecurity Posture Dashboard</h2>
            <p className="text-sm text-slate-400">Governance visibility · Threat monitoring · Endpoint compliance</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <div className="text-xl font-bold text-amber-400">{m.threatLevel}</div>
              <div className="text-xs text-amber-300">Threat Level</div>
            </div>
            <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="text-xl font-bold text-red-400">{m.openIncidents}</div>
              <div className="text-xs text-red-300">Open Incidents</div>
            </div>
            <div className="px-4 py-2 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div className="text-xl font-bold text-emerald-400">{m.resolvedThisWeek}</div>
              <div className="text-xs text-emerald-300">Resolved This Week</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Failed Logins (24h)', value: m.failedLogins24h.toLocaleString(), color: '#ef4444', note: '↑ 12% vs yesterday' },
          { label: 'Threats Blocked (7d)', value: m.blockedThreats7d.toLocaleString(), color: '#10b981', note: '99.8% block rate' },
          { label: 'Endpoint Compliance', value: `${m.endpointCompliance}%`, color: '#2563eb', note: '87 endpoints pending' },
          { label: 'Patch Compliance', value: `${m.patchCompliance}%`, color: '#f59e0b', note: 'Target: 95%' },
        ].map(k => (
          <div key={k.label} className="p-4" style={card}>
            <div className="text-xs text-slate-500 mb-2">{k.label}</div>
            <div className="text-2xl font-bold mb-1" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-slate-400">{k.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Risk gauge + endpoint */}
        <div className="p-5 flex flex-col items-center justify-between gap-4" style={card}>
          <h3 className="font-semibold text-slate-800 self-start">Security Risk Score</h3>
          <RiskGauge score={m.riskScore} />
          <div className="w-full space-y-2">
            {ENDPOINT_STATUS.map(ep => (
              <div key={ep.category}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{ep.category}</span>
                  <span className="font-semibold text-slate-700">{ep.count} ({ep.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${ep.pct}%`, background: ep.category === 'Compliant' ? '#10b981' : ep.category === 'Patch Pending' ? '#f59e0b' : '#ef4444' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-400 self-start">1,357 endpoints monitored</div>
        </div>

        {/* Threat timeline */}
        <div className="xl:col-span-2 p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-1">7-Day Threat Activity</h3>
          <p className="text-xs text-slate-400 mb-4">Threats detected vs blocked · Simulated feed</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={THREAT_TIMELINE} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={chartTooltip}/>
              <Bar dataKey="threats"  fill="#ef4444" radius={[3,3,0,0]} name="Detected" opacity={0.3}/>
              <Bar dataKey="blocked"  fill="#10b981" radius={[3,3,0,0]} name="Blocked" opacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-400 opacity-50" />Detected</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" />Blocked</span>
          </div>
        </div>
      </div>

      {/* Incidents */}
      <div className="p-5" style={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Recent Security Incidents</h3>
          <span className="text-xs text-slate-400">Simulated feed · Updated in real-time</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left px-3 py-2 font-medium">ID</th>
                <th className="text-left px-3 py-2 font-medium">Severity</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-left px-3 py-2 font-medium">Asset</th>
                <th className="text-left px-3 py-2 font-medium">Time</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {SECURITY_INCIDENTS.map((inc, i) => {
                const sv = SEVERITY_STYLES[inc.severity]
                const st = INCIDENT_STATUS_STYLES[inc.status]
                return (
                  <tr key={inc.id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: i < SECURITY_INCIDENTS.length-1 ? '1px solid #f8fafc' : 'none' }}>
                    <td className="px-3 py-3 font-mono text-xs text-slate-500">{inc.id}</td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: sv.bg, color: sv.text, border: `1px solid ${sv.border}` }}>{inc.severity}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">{inc.type}</td>
                    <td className="px-3 py-3 text-xs font-mono text-slate-600">{inc.asset}</td>
                    <td className="px-3 py-3 text-xs text-slate-400">{inc.time}</td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: st.bg, color: st.text }}>{inc.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance checks */}
      <div className="p-5" style={card}>
        <h3 className="font-semibold text-slate-800 mb-4">Security Compliance Checklist</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { check: 'MFA Enforcement', status: 'pass', note: '98.4% of accounts' },
            { check: 'Data Encryption at Rest', status: 'pass', note: 'AES-256 · All systems' },
            { check: 'VPN Access Control', status: 'pass', note: '100% remote access via VPN' },
            { check: 'Endpoint Patch Level', status: 'warn', note: '87.2% (target 95%)' },
            { check: 'PDPA Compliance Review', status: 'fail', note: 'Overdue 30 days' },
            { check: 'Privileged Access Review', status: 'pass', note: 'Quarterly review complete' },
          ].map(c => (
            <div key={c.check} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm"
                style={{ background: c.status === 'pass' ? '#f0fdf4' : c.status === 'warn' ? '#fffbeb' : '#fef2f2' }}>
                {c.status === 'pass' ? '✓' : c.status === 'warn' ? '⚠' : '✗'}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-700">{c.check}</div>
                <div className="text-xs text-slate-400">{c.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
