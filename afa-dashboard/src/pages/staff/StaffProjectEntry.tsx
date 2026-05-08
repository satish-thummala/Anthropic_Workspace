import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { addProjectUpdate, updateProjectUpdate, deleteProjectUpdate, ProjectUpdate } from '../../store/staffDataSlice'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const inp  = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1e293b', width: '100%', outline: 'none' }

const PROJECTS = [
  { id: 'PRJ-001', name: 'PLUS Highway O&M Phase 3' },
  { id: 'PRJ-002', name: 'Toll System Upgrade — KL' },
  { id: 'PRJ-003', name: 'Seremban Commercial Dev' },
  { id: 'PRJ-004', name: 'Ayer Keroh Interchange' },
  { id: 'PRJ-005', name: 'Smart Surveillance Network' },
  { id: 'PRJ-006', name: 'Johor Bahru Access Roads' },
  { id: 'PRJ-007', name: 'HQ Digital Transformation' },
  { id: 'PRJ-008', name: 'Compliance Mgmt System' },
]

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  draft:     { bg: '#f1f5f9', text: '#64748b' },
  submitted: { bg: '#eff6ff', text: '#1d4ed8' },
  approved:  { bg: '#f0fdf4', text: '#15803d' },
}

const ISSUE_COLOR: Record<string, string> = {
  none: '#10b981', minor: '#f59e0b', major: '#f97316', critical: '#ef4444',
}

const EMPTY: Omit<ProjectUpdate, 'id' | 'submittedBy' | 'submittedAt' | 'status'> = {
  projectId: 'PRJ-001', projectName: 'PLUS Highway O&M Phase 3',
  date: new Date().toISOString().split('T')[0],
  progressPct: 0, milestoneReached: '',
  issuesFlag: 'none', issueDescription: '',
  budgetSpentToDate: 0, workforceOnSite: 0,
}

export default function StaffProjectEntry() {
  const dispatch = useDispatch<AppDispatch>()
  const user     = useSelector((s: RootState) => s.auth.user)
  const entries  = useSelector((s: RootState) => s.staffData.projectUpdates)

  const [form, setForm]       = useState({ ...EMPTY })
  const [editId, setEditId]   = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast]     = useState<string | null>(null)

  const accentColor = user?.entityColor ?? '#10b981'
  const showToast   = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const genId       = () => `PU-${Date.now().toString().slice(-5)}`
  const now         = () => new Date().toLocaleString('en-MY', { hour12: false }).replace(',', '')

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const handleProjectChange = (projectId: string) => {
    const p = PROJECTS.find(p => p.id === projectId)
    setForm(prev => ({ ...prev, projectId, projectName: p?.name ?? '' }))
  }

  const handleSave = (asDraft = false) => {
    if (!user) return
    const entry: ProjectUpdate = {
      ...form,
      id: editId ?? genId(),
      submittedBy: user.name,
      submittedAt: now(),
      status: asDraft ? 'draft' : 'submitted',
    }
    if (editId) { dispatch(updateProjectUpdate(entry)); showToast('Entry updated') }
    else { dispatch(addProjectUpdate(entry)); showToast(asDraft ? 'Saved as draft' : 'Project update submitted!') }
    setForm({ ...EMPTY }); setEditId(null); setShowForm(false)
  }

  const handleEdit = (e: ProjectUpdate) => {
    setForm({ projectId: e.projectId, projectName: e.projectName, date: e.date, progressPct: e.progressPct, milestoneReached: e.milestoneReached, issuesFlag: e.issuesFlag, issueDescription: e.issueDescription, budgetSpentToDate: e.budgetSpentToDate, workforceOnSite: e.workforceOnSite })
    setEditId(e.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id: string) => { dispatch(deleteProjectUpdate(id)); setDeleteConfirm(null); showToast('Entry deleted') }

  return (
    <div className="space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl" style={{ background: '#10b981' }}>✓ {toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Project Updates</h2>
          <p className="text-xs text-slate-400">Submit daily progress, milestones, and issue flags per project</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY }) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Update
        </button>
      </div>

      {showForm && (
        <div className="p-6 rounded-2xl" style={{ ...card, border: `1.5px solid ${accentColor}40` }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800">{editId ? 'Edit Project Update' : 'New Project Update'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-slate-400 hover:text-slate-600">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Project *</label>
              <select value={form.projectId} onChange={e => handleProjectChange(e.target.value)} style={inp}>
                {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Report Date *</label>
              <input type="date" value={form.date} onChange={f('date')} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Progress % *</label>
              <input type="number" value={form.progressPct} onChange={f('progressPct')} min={0} max={100} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Budget Spent to Date (RM)</label>
              <input type="number" value={form.budgetSpentToDate} onChange={f('budgetSpentToDate')} min={0} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Workforce On-Site (headcount)</label>
              <input type="number" value={form.workforceOnSite} onChange={f('workforceOnSite')} min={0} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Issue Flag *</label>
              <select value={form.issuesFlag} onChange={f('issuesFlag')} style={{ ...inp, color: ISSUE_COLOR[form.issuesFlag] }}>
                <option value="none">✅ No Issues</option>
                <option value="minor">⚠️ Minor Issue</option>
                <option value="major">🟠 Major Issue</option>
                <option value="critical">🔴 Critical Issue</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Milestone Reached Today</label>
            <input type="text" value={form.milestoneReached} onChange={f('milestoneReached')} placeholder="e.g. Piling works Zone B completed" style={inp}/>
          </div>
          {form.issuesFlag !== 'none' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Issue Description *</label>
              <textarea value={form.issueDescription} onChange={f('issueDescription')} rows={3} placeholder="Describe the issue, root cause, and action taken..."
                style={{ ...inp, resize: 'vertical' }}/>
            </div>
          )}
          {/* Progress bar preview */}
          <div className="mb-5 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-600">Progress Preview</span>
              <span className="font-bold" style={{ color: accentColor }}>{form.progressPct}%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${form.progressPct}%`, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)` }}/>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleSave(true)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all border border-slate-200">Save as Draft</button>
            <button onClick={() => handleSave(false)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}>Submit Update</button>
          </div>
        </div>
      )}

      <div style={card}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#f1f5f9' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Submitted Project Updates</h3>
            <span className="text-xs text-slate-400">{entries.length} records</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left px-5 py-3 font-medium">ID</th>
                <th className="text-left px-5 py-3 font-medium">Project</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-right px-5 py-3 font-medium">Progress</th>
                <th className="text-left px-5 py-3 font-medium">Issues</th>
                <th className="text-right px-5 py-3 font-medium">On-Site</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">No updates yet.</td></tr>}
              {entries.map((e, i) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: i < entries.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{e.id}</td>
                  <td className="px-5 py-3">
                    <div className="text-xs font-bold text-slate-400">{e.projectId}</div>
                    <div className="text-sm font-medium text-slate-700">{e.projectName}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{e.date}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${e.progressPct}%`, background: accentColor }}/>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{e.progressPct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full"
                      style={{ background: `${ISSUE_COLOR[e.issuesFlag]}15`, color: ISSUE_COLOR[e.issuesFlag] }}>
                      {e.issuesFlag}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">{e.workforceOnSite}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={STATUS_STYLE[e.status]}>{e.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      {e.status === 'draft' && <button onClick={() => handleEdit(e)} className="text-xs px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 font-medium">Edit</button>}
                      {deleteConfirm === e.id
                        ? <><button onClick={() => handleDelete(e.id)} className="text-xs px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 font-semibold">Confirm</button><button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 rounded-lg text-slate-500 hover:bg-slate-100">Cancel</button></>
                        : <button onClick={() => setDeleteConfirm(e.id)} className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50">Delete</button>}
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
