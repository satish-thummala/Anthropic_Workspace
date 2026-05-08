import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { addHREntry, updateHREntry, deleteHREntry, HREntry } from '../../store/staffDataSlice'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const inp  = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1e293b', width: '100%', outline: 'none' }

const DEPARTMENTS = ['Project Delivery','Toll Operations','Finance & Treasury','Contract & Procurement','O&M','IT & Technical','Human Capital','Compliance','Facility Management']

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  draft:     { bg: '#f1f5f9', text: '#64748b' },
  submitted: { bg: '#eff6ff', text: '#1d4ed8' },
  approved:  { bg: '#f0fdf4', text: '#15803d' },
}

const EMPTY: Omit<HREntry, 'id' | 'submittedBy' | 'submittedAt' | 'status'> = {
  department: 'Project Delivery',
  date: new Date().toISOString().split('T')[0],
  presentCount: 0, absentCount: 0, onLeaveCount: 0,
  overtimeHours: 0, newJoiners: 0, resignations: 0, openVacancies: 0,
  notes: '',
}

export default function StaffHREntry() {
  const dispatch = useDispatch<AppDispatch>()
  const user     = useSelector((s: RootState) => s.auth.user)
  const entries  = useSelector((s: RootState) => s.staffData.hrEntries)

  const [form, setForm]       = useState({ ...EMPTY })
  const [editId, setEditId]   = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast]     = useState<string | null>(null)

  const accentColor = user?.entityColor ?? '#8b5cf6'
  const showToast   = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const genId       = () => `HR-${Date.now().toString().slice(-5)}`
  const now         = () => new Date().toLocaleString('en-MY', { hour12: false }).replace(',', '')

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const handleSave = (asDraft = false) => {
    if (!user) return
    const entry: HREntry = { ...form, id: editId ?? genId(), submittedBy: user.name, submittedAt: now(), status: asDraft ? 'draft' : 'submitted' }
    if (editId) { dispatch(updateHREntry(entry)); showToast('Entry updated') }
    else { dispatch(addHREntry(entry)); showToast(asDraft ? 'Saved as draft' : 'HR report submitted!') }
    setForm({ ...EMPTY }); setEditId(null); setShowForm(false)
  }

  const handleEdit = (e: HREntry) => {
    setForm({ department: e.department, date: e.date, presentCount: e.presentCount, absentCount: e.absentCount, onLeaveCount: e.onLeaveCount, overtimeHours: e.overtimeHours, newJoiners: e.newJoiners, resignations: e.resignations, openVacancies: e.openVacancies, notes: e.notes })
    setEditId(e.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id: string) => { dispatch(deleteHREntry(id)); setDeleteConfirm(null); showToast('Entry deleted') }

  const totalAccounted = form.presentCount + form.absentCount + form.onLeaveCount

  return (
    <div className="space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl" style={{ background: '#10b981' }}>✓ {toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Daily HR Report</h2>
          <p className="text-xs text-slate-400">Submit daily headcount, attendance, overtime, and staff movement per department</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY }) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Report
        </button>
      </div>

      {showForm && (
        <div className="p-6 rounded-2xl" style={{ ...card, border: `1.5px solid ${accentColor}40` }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800">{editId ? 'Edit HR Report' : 'New Daily HR Report'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-slate-400 hover:text-slate-600">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department *</label>
              <select value={form.department} onChange={f('department')} style={inp}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date *</label>
              <input type="date" value={form.date} onChange={f('date')} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Present Count *</label>
              <input type="number" value={form.presentCount} onChange={f('presentCount')} min={0} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Absent Count</label>
              <input type="number" value={form.absentCount} onChange={f('absentCount')} min={0} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">On Leave Count</label>
              <input type="number" value={form.onLeaveCount} onChange={f('onLeaveCount')} min={0} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Overtime Hours (total dept)</label>
              <input type="number" value={form.overtimeHours} onChange={f('overtimeHours')} min={0} step={0.5} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Joiners Today</label>
              <input type="number" value={form.newJoiners} onChange={f('newJoiners')} min={0} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Resignations Today</label>
              <input type="number" value={form.resignations} onChange={f('resignations')} min={0} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Open Vacancies (current)</label>
              <input type="number" value={form.openVacancies} onChange={f('openVacancies')} min={0} style={inp}/>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes / Remarks</label>
            <textarea value={form.notes} onChange={f('notes')} rows={2} placeholder="Any notable HR events, disciplinary actions, training sessions..." style={{ ...inp, resize: 'vertical' }}/>
          </div>
          {/* Summary preview */}
          {totalAccounted > 0 && (
            <div className="mb-5 p-3 rounded-xl grid grid-cols-3 gap-3" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
              {[{ label: 'Present', val: form.presentCount, color: '#10b981' }, { label: 'Absent', val: form.absentCount, color: '#ef4444' }, { label: 'On Leave', val: form.onLeaveCount, color: '#f59e0b' }].map(r => (
                <div key={r.label} className="text-center">
                  <div className="text-xl font-bold" style={{ color: r.color }}>{r.val}</div>
                  <div className="text-xs text-slate-500">{r.label} ({totalAccounted > 0 ? ((r.val / totalAccounted) * 100).toFixed(0) : 0}%)</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => handleSave(true)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all border border-slate-200">Save as Draft</button>
            <button onClick={() => handleSave(false)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}>Submit Report</button>
          </div>
        </div>
      )}

      <div style={card}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#f1f5f9' }}>
          <h3 className="font-semibold text-slate-800">Submitted HR Reports</h3>
          <span className="text-xs text-slate-400">{entries.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left px-5 py-3 font-medium">Department</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-right px-5 py-3 font-medium">Present</th>
                <th className="text-right px-5 py-3 font-medium">Absent</th>
                <th className="text-right px-5 py-3 font-medium">OT Hrs</th>
                <th className="text-right px-5 py-3 font-medium">Joiners</th>
                <th className="text-right px-5 py-3 font-medium">Resign</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && <tr><td colSpan={9} className="px-5 py-8 text-center text-slate-400">No HR reports yet.</td></tr>}
              {entries.map((e, i) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: i < entries.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td className="px-5 py-3 font-medium text-slate-700">{e.department}</td>
                  <td className="px-5 py-3 text-slate-600">{e.date}</td>
                  <td className="px-5 py-3 text-right font-semibold text-emerald-600">{e.presentCount}</td>
                  <td className="px-5 py-3 text-right font-semibold text-red-500">{e.absentCount}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{e.overtimeHours}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{e.newJoiners}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{e.resignations}</td>
                  <td className="px-5 py-3"><span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={STATUS_STYLE[e.status]}>{e.status}</span></td>
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
