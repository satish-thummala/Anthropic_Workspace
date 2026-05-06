import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { ENTITY_DATA } from '../../data/entityData'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const darkCard = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }

export default function EntityCompliance() {
  const user = useSelector((s: RootState) => s.auth.user)
  if (!user) return null
  const data = ENTITY_DATA[user.entityShort]
  if (!data) return null

  const accentColor = user.entityColor
  const score = data.complianceScore

  const CHECKS = [
    { area: 'Board Governance',         status: 'pass',  note: 'Board charter current · Resolutions filed' },
    { area: 'PDPA Compliance',          status: 'fail',  note: 'Review overdue 30 days — action required' },
    { area: 'CIDB Registration',        status: 'pass',  note: 'All active contractors registered' },
    { area: 'SOX Controls (Q1)',        status: 'warn',  note: '4 evidence items pending documentation' },
    { area: 'Annual DOSH Audit',        status: 'warn',  note: 'Due May 31 — preparation in progress' },
    { area: 'ESG Reporting',            status: 'pass',  note: 'Framework in place · FY2024 filed' },
    { area: 'Anti-Bribery (MACC)',      status: 'pass',  note: 'Training complete · 98% staff certified' },
    { area: 'Data Retention Policy',    status: 'warn',  note: 'Policy review due — IT team engaged' },
  ]

  const DEADLINES = data.upcomingDeadlines

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: accentColor }} />
              <span className="text-xs font-medium" style={{ color: accentColor }}>LIVE · Compliance & Governance · {user.entity}</span>
            </div>
            <h2 className="text-xl font-bold text-white">Compliance & Governance</h2>
            <p className="text-sm text-slate-400">Regulatory adherence, audit tracking & governance oversight</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Compliance Score', val: `${score}%`, color: score >= 90 ? '#10b981' : '#f59e0b', bg: score >= 90 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', border: score >= 90 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)' },
              { label: 'Open Gaps',        val: String(CHECKS.filter(c => c.status !== 'pass').length), color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
              { label: 'Deadlines Soon',   val: String(DEADLINES.filter(d => d.days <= 14).length), color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
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
        {/* Score gauge */}
        <div className="p-5 flex flex-col items-center" style={card}>
          <h3 className="font-semibold text-slate-800 mb-4 self-start">Compliance Score</h3>
          <svg width="160" height="90" viewBox="0 0 160 90" className="mb-3">
            <path d="M 10 85 A 70 70 0 0 1 150 85" fill="none" stroke="#f1f5f9" strokeWidth="14" strokeLinecap="round"/>
            <path d="M 10 85 A 70 70 0 0 1 150 85" fill="none"
              stroke={score >= 90 ? '#10b981' : score >= 80 ? '#f59e0b' : '#ef4444'}
              strokeWidth="14" strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 220} 220`}/>
            <text x="80" y="76" textAnchor="middle" fontSize="24" fontWeight="800" fill="#1e293b">{score}%</text>
          </svg>
          <div className="w-full space-y-2">
            {[
              { label: 'Pass',    count: CHECKS.filter(c => c.status === 'pass').length, color: '#10b981' },
              { label: 'Warning', count: CHECKS.filter(c => c.status === 'warn').length, color: '#f59e0b' },
              { label: 'Fail',    count: CHECKS.filter(c => c.status === 'fail').length, color: '#ef4444' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center py-1.5 border-b last:border-0" style={{ borderColor: '#f8fafc' }}>
                <span className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />{r.label}
                </span>
                <span className="font-bold text-sm" style={{ color: r.color }}>{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance checklist */}
        <div className="xl:col-span-2 p-5" style={card}>
          <h3 className="font-semibold text-slate-800 mb-4">Compliance Checklist</h3>
          <div className="space-y-2">
            {CHECKS.map(c => (
              <div key={c.area} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: c.status === 'pass' ? '#f0fdf4' : c.status === 'warn' ? '#fffbeb' : '#fef2f2', border: `1px solid ${c.status === 'pass' ? '#bbf7d0' : c.status === 'warn' ? '#fde68a' : '#fecaca'}` }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ background: '#fff', color: c.status === 'pass' ? '#10b981' : c.status === 'warn' ? '#f59e0b' : '#ef4444' }}>
                  {c.status === 'pass' ? '✓' : c.status === 'warn' ? '!' : '✗'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-700">{c.area}</div>
                  <div className="text-xs text-slate-500">{c.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deadlines */}
      <div className="p-5" style={card}>
        <h3 className="font-semibold text-slate-800 mb-4">Regulatory Deadlines</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEADLINES.map((d, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: d.days <= 5 ? '#fef2f2' : d.days <= 14 ? '#fffbeb' : '#f0fdf4', border: `1px solid ${d.days <= 5 ? '#fecaca' : d.days <= 14 ? '#fde68a' : '#bbf7d0'}` }}>
              <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                style={{ background: '#fff' }}>
                <div className="text-xl font-black" style={{ color: d.days <= 5 ? '#dc2626' : d.days <= 14 ? '#d97706' : '#16a34a' }}>{d.days}</div>
                <div className="text-xs font-semibold text-slate-400">days</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-700 leading-tight">{d.item}</div>
                <div className="text-xs text-slate-400 mt-0.5">Due: {d.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
