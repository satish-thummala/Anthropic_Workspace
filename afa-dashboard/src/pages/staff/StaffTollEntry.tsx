import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { addTollEntry, updateTollEntry, deleteTollEntry, TollEntry } from '../../store/staffDataSlice'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const inp  = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1e293b', width: '100%', outline: 'none' }

const PLAZAS = [
  { id: 'TP01', name: 'Plaza Sg. Besi' },
  { id: 'TP02', name: 'Plaza Nilai' },
  { id: 'TP03', name: 'Plaza Seremban' },
  { id: 'TP04', name: 'Plaza Ayer Keroh' },
  { id: 'TP05', name: 'Plaza Pagoh' },
  { id: 'TP06', name: 'Plaza Yong Peng' },
  { id: 'TP07', name: 'Plaza Skudai' },
]

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  draft:     { bg: '#f1f5f9', text: '#64748b' },
  submitted: { bg: '#eff6ff', text: '#1d4ed8' },
  approved:  { bg: '#f0fdf4', text: '#15803d' },
}

const EMPTY: Omit<TollEntry, 'id' | 'submittedBy' | 'submittedAt' | 'status'> = {
  plazaId: 'TP01', plazaName: 'Plaza Sg. Besi',
  date: new Date().toISOString().split('T')[0],
  shift: 'morning',
  vehicleCount: 0, revenue: 0, cashRevenue: 0, cardRevenue: 0, rfidRevenue: 0,
  incidentNotes: '',
}

export default function StaffTollEntry() {
  const dispatch = useDispatch<AppDispatch>()
  const user     = useSelector((s: RootState) => s.auth.user)
  const entries  = useSelector((s: RootState) => s.staffData.tollEntries)

  const [form, setForm]     = useState({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast]   = useState<string | null>(null)

  const accentColor = user?.entityColor ?? '#f97316'

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const genId = () => `TE-${Date.now().toString().slice(-5)}`
  const now   = () => new Date().toLocaleString('en-MY', { hour12: false }).replace(',', '')

  const handlePlazaChange = (plazaId: string) => {
    const p = PLAZAS.find(p => p.id === plazaId)
    setForm(f => ({ ...f, plazaId, plazaName: p?.name ?? '' }))
  }

  const handleSave = (asDraft = false) => {
    if (!user) return
    const entry: TollEntry = {
      ...form,
      id: editId ?? genId(),
      submittedBy: user.name,
      submittedAt: now(),
      status: asDraft ? 'draft' : 'submitted',
    }
    if (editId) {
      dispatch(updateTollEntry(entry))
      showToast('Entry updated successfully')
    } else {
      dispatch(addTollEntry(entry))
      showToast(asDraft ? 'Saved as draft' : 'Report submitted successfully!')
    }
    setForm({ ...EMPTY })
    setEditId(null)
    setShowForm(false)
  }

  const handleEdit = (e: TollEntry) => {
    setForm({ plazaId: e.plazaId, plazaName: e.plazaName, date: e.date, shift: e.shift, vehicleCount: e.vehicleCount, revenue: e.revenue, cashRevenue: e.cashRevenue, cardRevenue: e.cardRevenue, rfidRevenue: e.rfidRevenue, incidentNotes: e.incidentNotes })
    setEditId(e.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id: string) => {
    dispatch(deleteTollEntry(id))
    setDeleteConfirm(null)
    showToast('Entry deleted')
  }

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl"
          style={{ background: '#10b981' }}>✓ {toast}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Toll Daily Report</h2>
          <p className="text-xs text-slate-400">Submit vehicle counts and revenue per shift per plaza</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY }) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Report
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-6 rounded-2xl" style={{ ...card, border: `1.5px solid ${accentColor}40` }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800">{editId ? 'Edit Toll Report' : 'New Toll Daily Report'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="text-slate-400 hover:text-slate-600">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Plaza *</label>
              <select value={form.plazaId} onChange={e => handlePlazaChange(e.target.value)} style={inp}>
                {PLAZAS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date *</label>
              <input type="date" value={form.date} onChange={f('date')} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Shift *</label>
              <select value={form.shift} onChange={f('shift')} style={inp}>
                <option value="morning">Morning (6AM–2PM)</option>
                <option value="afternoon">Afternoon (2PM–10PM)</option>
                <option value="night">Night (10PM–6AM)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Total Vehicle Count *</label>
              <input type="number" value={form.vehicleCount} onChange={f('vehicleCount')} min={0} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Total Revenue (RM) *</label>
              <input type="number" value={form.revenue} onChange={f('revenue')} min={0} step={0.01} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cash Revenue (RM)</label>
              <input type="number" value={form.cashRevenue} onChange={f('cashRevenue')} min={0} step={0.01} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Card Revenue (RM)</label>
              <input type="number" value={form.cardRevenue} onChange={f('cardRevenue')} min={0} step={0.01} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">RFID / Touch'n Go (RM)</label>
              <input type="number" value={form.rfidRevenue} onChange={f('rfidRevenue')} min={0} step={0.01} style={inp}/>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Incident / Operational Notes</label>
            <textarea value={form.incidentNotes} onChange={f('incidentNotes')} rows={3} placeholder="Describe any lane issues, incidents, system downtime, or notable events during this shift..."
              style={{ ...inp, resize: 'vertical' }} />
          </div>

          {/* Revenue breakdown preview */}
          {form.revenue > 0 && (
            <div className="mb-5 p-3 rounded-xl" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
              <div className="text-xs font-semibold mb-2" style={{ color: accentColor }}>Revenue Breakdown Preview</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Cash', val: form.cashRevenue },
                  { label: 'Card', val: form.cardRevenue },
                  { label: 'RFID', val: form.rfidRevenue },
                ].map(r => (
                  <div key={r.label} className="text-center">
                    <div className="text-sm font-bold text-slate-800">RM {r.val.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{r.label} ({form.revenue > 0 ? ((r.val / form.revenue) * 100).toFixed(1) : 0}%)</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => handleSave(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all border border-slate-200">
              Save as Draft
            </button>
            <button onClick={() => handleSave(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}>
              Submit Report
            </button>
          </div>
        </div>
      )}

      {/* Records table */}
      <div style={card}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#f1f5f9' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Submitted Reports</h3>
            <span className="text-xs text-slate-400">{entries.length} records</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left px-5 py-3 font-medium">ID</th>
                <th className="text-left px-5 py-3 font-medium">Plaza</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Shift</th>
                <th className="text-right px-5 py-3 font-medium">Vehicles</th>
                <th className="text-right px-5 py-3 font-medium">Revenue (RM)</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">No reports yet. Click New Report to get started.</td></tr>
              )}
              {entries.map((e, i) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors"
                  style={{ borderBottom: i < entries.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{e.id}</td>
                  <td className="px-5 py-3 font-medium text-slate-700">{e.plazaName}</td>
                  <td className="px-5 py-3 text-slate-600">{e.date}</td>
                  <td className="px-5 py-3 capitalize text-slate-600">{e.shift}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-700">{e.vehicleCount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-700">RM {e.revenue.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={STATUS_STYLE[e.status]}>{e.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {e.status === 'draft' && (
                        <button onClick={() => handleEdit(e)} className="text-xs px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors font-medium">Edit</button>
                      )}
                      {deleteConfirm === e.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(e.id)} className="text-xs px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 font-semibold">Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 rounded-lg text-slate-500 hover:bg-slate-100">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(e.id)} className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors">Delete</button>
                      )}
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
