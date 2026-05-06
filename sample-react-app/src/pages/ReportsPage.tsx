import { useState } from 'react'

const REPORTS = [
  { id: 1, name: 'Q3 2025 Revenue Report', type: 'Financial', status: 'Ready', date: 'Aug 31, 2025', size: '2.4 MB' },
  { id: 2, name: 'User Acquisition Summary', type: 'Marketing', status: 'Ready', date: 'Aug 28, 2025', size: '1.1 MB' },
  { id: 3, name: 'Monthly Active Users', type: 'Analytics', status: 'Processing', date: 'Aug 25, 2025', size: '—' },
  { id: 4, name: 'Churn Analysis Report', type: 'Product', status: 'Ready', date: 'Aug 22, 2025', size: '890 KB' },
  { id: 5, name: 'Infrastructure Cost Report', type: 'Engineering', status: 'Failed', date: 'Aug 20, 2025', size: '—' },
  { id: 6, name: 'Q2 2025 Revenue Report', type: 'Financial', status: 'Ready', date: 'Jul 31, 2025', size: '2.1 MB' },
  { id: 7, name: 'Content Performance', type: 'Marketing', status: 'Ready', date: 'Jul 28, 2025', size: '760 KB' },
]

const STATUS_STYLES: Record<string, string> = {
  Ready: 'text-emerald-600 bg-emerald-50',
  Processing: 'text-amber-600 bg-amber-50',
  Failed: 'text-red-500 bg-red-50',
}

const TYPE_COLORS: Record<string, string> = {
  Financial: '#6366f1',
  Marketing: '#10b981',
  Analytics: '#f59e0b',
  Product: '#8b5cf6',
  Engineering: '#06b6d4',
}

const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16 }

export default function ReportsPage() {
  const [filter, setFilter] = useState('All')
  const types = ['All', 'Financial', 'Marketing', 'Analytics', 'Product', 'Engineering']
  const filtered = filter === 'All' ? REPORTS : REPORTS.filter(r => r.type === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Reports</h2>
          <p className="text-sm text-slate-400">Generated reports and exports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: '142', icon: '📄' },
          { label: 'Ready', value: '118', icon: '✅' },
          { label: 'Processing', value: '12', icon: '⏳' },
          { label: 'Failed', value: '12', icon: '❌' },
        ].map(s => (
          <div key={s.label} className="p-4 text-center" style={cardStyle}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={filter === t
              ? { background: '#6366f1', color: 'white' }
              : { background: '#f8fafc', color: '#64748b', border: '1px solid #e5e7eb' }}>
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-hidden" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-400" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left px-5 py-3 font-medium">Report Name</th>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Size</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0"
                        style={{ background: `${TYPE_COLORS[r.type]}15`, color: TYPE_COLORS[r.type] }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <span className="text-slate-700 font-medium">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: `${TYPE_COLORS[r.type]}15`, color: TYPE_COLORS[r.type] }}>{r.type}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{r.date}</td>
                  <td className="px-5 py-4 text-slate-500 font-mono text-xs">{r.size}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {r.status === 'Ready' && (
                        <button className="text-xs px-3 py-1 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors font-medium">Download</button>
                      )}
                      <button className="text-xs px-3 py-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
