import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { addComplianceEntry, updateComplianceEntry, deleteComplianceEntry, ComplianceEntry } from '../../store/staffDataSlice'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const inp  = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1e293b', width: '100%', outline: 'none' }

const COMPLIANCE_TYPES = [
  'CIDB Submission', 'DOSH Safety Audit', 'BNM Quarterly Report',
  'PDPA Review', 'ESG Reporting', 'Anti-Bribery (MACC)',
  'Annual Fire Drill', 'ISO Certification Renewal', 'Contractor License Renewal',
  'Environmental Impact Assessment', 'Other',
]

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  pending:     { bg: '#fffbeb', text: '#d97706', dot: '#f59e0b' },
  'in-progress': { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  completed:   { bg: '#f0fdf4', text: '#15803d', dot: '#10b981' },
  overdue:     { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
}

const EMPTY: Omit<ComplianceEntry, 'id' | 'submittedBy' | 'submittedAt'> = {
  complianceType: 'CIDB Submission',
  referenceNo: '',
  dueDate: '',
  completionDate: '',
  status: 'pending',
  assignedTo: '',
  evidenceDescription: '',
  remarks: '',
}

export default function StaffComplianceEntry() {
  const dispatch = useDispatch<AppDispatch>()
  const user     = useSelector((s: RootState) => s.auth.user)
  const entries  = useSelector((s: RootState) => s.staffData.complianceEntries)

  const [form, setForm]         = useState({ ...EMPTY })
  const [editId, setEditId]     = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast]       = useState<string | null>(null)

  const accentColor = user?.entityColor ?? '#dc2626'
  const showToast   = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const genId       = () => `CO-${Date.now().toString().slice(-5)}`
  const now         = () => new Date().toLocaleString('en-MY', { hour12: false }).replace(',', '')

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  const handleSave = () => {
    if (!user) return
    const entry: ComplianceEntry = { ...form, id: editId ?? genId(), submittedBy: user.name, submittedAt: now() }
    if (editId) { dispatch(updateComplianceEntry(entry)); showToast('Entry updated') }
    else { dispatch(addComplianceEntry(entry)); showToast('Compliance record saved!') }
    setForm({ ...EMPTY }); setEditId(null); setShowForm(false)
  }

  const handleEdit = (e: ComplianceEntry) => {
    setForm({ complianceType: e.complianceType, referenceNo: e.referenceNo, dueDate: e.dueDate, completionDate: e.completionDate, status: e.status, assignedTo: e.assignedTo, evidenceDescription: e.evidenceDescription, remarks: e.remarks })
    setEditId(e.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id: string) => { dispatch(deleteComplianceEntry(id)); setDeleteConfirm(null); showToast('Entry deleted') }

  const counts = { pending: entries.filter(e => e.status === 'pending').length, 'in-progress': entries.filter(e => e.status === 'in-progress').length, completed: entries.filter(e => e.status === 'completed').length, overdue: entries.filter(e => e.status === 'overdue').length }

  return (
    <div className="space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl" style={{ background: '#10b981' }}>✓ {toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Compliance Tracking</h2>
          <p className="text-xs text-slate-400">Record and track regulatory compliance items, submissions, and evidence</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY }) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Record
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { key: 'overdue',      label: 'Overdue' },
          { key: 'pending',      label: 'Pending' },
          { key: 'in-progress',  label: 'In Progress' },
          { key: 'completed',    label: 'Completed' },
        ].map(s => (
          <div key={s.key} className="p-4 rounded-2xl" style={{ ...card, borderLeft: `4px solid ${STATUS_STYLE[s.key].dot}` }}>
            <div className="text-2xl font-bold mb-1" style={{ color: STATUS_STYLE[s.key].dot }}>{counts[s.key as keyof typeof counts]}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="p-6 rounded-2xl" style={{ ...card, border: `1.5px solid ${accentColor}40` }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800">{editId ? 'Edit Compliance Record' : 'New Compliance Record'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-slate-400 hover:text-slate-600">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Compliance Type *</label>
              <select value={form.complianceType} onChange={f('complianceType')} style={inp}>
                {COMPLIANCE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reference / File No.</label>
              <input type="text" value={form.referenceNo} onChange={f('referenceNo')} placeholder="e.g. CIDB-2025-PRJ004" style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Due Date *</label>
              <input type="date" value={form.dueDate} onChange={f('dueDate')} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Completion Date</label>
              <input type="date" value={form.completionDate} onChange={f('completionDate')} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status *</label>
              <select value={form.status} onChange={f('status')} style={{ ...inp, color: STATUS_STYLE[form.status].text }}>
                <option value="pending">⏳ Pending</option>
                <option value="in-progress">🔵 In Progress</option>
                <option value="completed">✅ Completed</option>
                <option value="overdue">🔴 Overdue</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assigned To *</label>
              <input type="text" value={form.assignedTo} onChange={f('assignedTo')} placeholder="Name or team responsible" style={inp}/>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Evidence / Actions Taken</label>
            <textarea value={form.evidenceDescription} onChange={f('evidenceDescription')} rows={3}
              placeholder="Describe evidence prepared, documents filed, actions completed, portal submission references..." style={{ ...inp, resize: 'vertical' }}/>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Remarks</label>
            <textarea value={form.remarks} onChange={f('remarks')} rows={2}
              placeholder="Any blockers, dependencies, or escalation notes..." style={{ ...inp, resize: 'vertical' }}/>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all border border-slate-200">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}>
              {editId ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </div>
      )}

      <div style={card}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#f1f5f9' }}>
          <h3 className="font-semibold text-slate-800">Compliance Records</h3>
          <span className="text-xs text-slate-400">{entries.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Reference</th>
                <th className="text-left px-5 py-3 font-medium">Due Date</th>
                <th className="text-left px-5 py-3 font-medium">Assigned To</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Submitted By</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">No compliance records yet.</td></tr>}
              {entries.map((e, i) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: i < entries.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td className="px-5 py-3">
                    <div className="text-sm font-medium text-slate-700">{e.complianceType}</div>
                    {e.remarks && <div className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{e.remarks}</div>}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{e.referenceNo || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium ${e.status === 'overdue' ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{e.dueDate || '—'}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{e.assignedTo}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold w-fit px-2 py-0.5 rounded-full capitalize"
                      style={STATUS_STYLE[e.status]}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_STYLE[e.status].dot }}/>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{e.submittedBy}<br/><span className="text-slate-400">{e.submittedAt}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(e)} className="text-xs px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 font-medium">Edit</button>
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
