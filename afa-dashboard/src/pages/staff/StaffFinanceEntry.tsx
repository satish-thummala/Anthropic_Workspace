import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { addFinanceEntry, updateFinanceEntry, deleteFinanceEntry, FinanceEntry } from '../../store/staffDataSlice'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const inp  = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1e293b', width: '100%', outline: 'none' }

const DEPARTMENTS = ['Project Delivery','Toll Operations','Finance & Treasury','Contract & Procurement','O&M','IT & Technical','Human Capital','Compliance']

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  draft:     { bg: '#f1f5f9', text: '#64748b' },
  submitted: { bg: '#eff6ff', text: '#1d4ed8' },
  approved:  { bg: '#f0fdf4', text: '#15803d' },
}

const APPROVAL_STYLE: Record<string, { bg: string; text: string }> = {
  pending:  { bg: '#fffbeb', text: '#d97706' },
  approved: { bg: '#f0fdf4', text: '#15803d' },
  rejected: { bg: '#fef2f2', text: '#dc2626' },
}

const CATEGORY_ICONS: Record<string, string> = {
  expense: '💸', revenue: '💰', invoice: '📄', payment: '✅',
}

const EMPTY: Omit<FinanceEntry, 'id' | 'submittedBy' | 'submittedAt' | 'status'> = {
  department: 'Project Delivery',
  category: 'expense',
  date: new Date().toISOString().split('T')[0],
  description: '', amount: 0, referenceNo: '', vendor: '',
  approvalStatus: 'pending', notes: '',
}

export default function StaffFinanceEntry() {
  const dispatch = useDispatch<AppDispatch>()
  const user     = useSelector((s: RootState) => s.auth.user)
  const entries  = useSelector((s: RootState) => s.staffData.financeEntries)

  const [form, setForm]       = useState({ ...EMPTY })
  const [editId, setEditId]   = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast]     = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')

  const accentColor = user?.entityColor ?? '#2563eb'
  const showToast   = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const genId       = () => `FE-${Date.now().toString().slice(-5)}`
  const now         = () => new Date().toLocaleString('en-MY', { hour12: false }).replace(',', '')

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const handleSave = (asDraft = false) => {
    if (!user) return
    const entry: FinanceEntry = { ...form, id: editId ?? genId(), submittedBy: user.name, submittedAt: now(), status: asDraft ? 'draft' : 'submitted' }
    if (editId) { dispatch(updateFinanceEntry(entry)); showToast('Entry updated') }
    else { dispatch(addFinanceEntry(entry)); showToast(asDraft ? 'Saved as draft' : 'Finance entry submitted!') }
    setForm({ ...EMPTY }); setEditId(null); setShowForm(false)
  }

  const handleEdit = (e: FinanceEntry) => {
    setForm({ department: e.department, category: e.category, date: e.date, description: e.description, amount: e.amount, referenceNo: e.referenceNo, vendor: e.vendor, approvalStatus: e.approvalStatus, notes: e.notes })
    setEditId(e.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id: string) => { dispatch(deleteFinanceEntry(id)); setDeleteConfirm(null); showToast('Entry deleted') }

  const filtered = filterCat === 'all' ? entries : entries.filter(e => e.category === filterCat)
  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-xl" style={{ background: '#10b981' }}>✓ {toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Finance & Expenses</h2>
          <p className="text-xs text-slate-400">Record expenses, invoices, revenue, and payment entries</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY }) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Entry
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {['expense','revenue','invoice','payment'].map(cat => {
          const catEntries = entries.filter(e => e.category === cat)
          const total = catEntries.reduce((s, e) => s + e.amount, 0)
          return (
            <div key={cat} className="p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md"
              style={{ ...card, border: filterCat === cat ? `1.5px solid ${accentColor}` : '1px solid #e2e8f0' }}
              onClick={() => setFilterCat(filterCat === cat ? 'all' : cat)}>
              <div className="text-xl mb-2">{CATEGORY_ICONS[cat]}</div>
              <div className="text-xs text-slate-400 capitalize mb-1">{cat}s</div>
              <div className="text-lg font-bold text-slate-800">RM {total.toLocaleString()}</div>
              <div className="text-xs text-slate-400">{catEntries.length} entries</div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="p-6 rounded-2xl" style={{ ...card, border: `1.5px solid ${accentColor}40` }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800">{editId ? 'Edit Finance Entry' : 'New Finance Entry'}</h3>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category *</label>
              <select value={form.category} onChange={f('category')} style={inp}>
                <option value="expense">💸 Expense</option>
                <option value="revenue">💰 Revenue</option>
                <option value="invoice">📄 Invoice</option>
                <option value="payment">✅ Payment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date *</label>
              <input type="date" value={form.date} onChange={f('date')} style={inp}/>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description *</label>
              <input type="text" value={form.description} onChange={f('description')} placeholder="e.g. Bitumen supply — PRJ-001 km 142" style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Amount (RM) *</label>
              <input type="number" value={form.amount} onChange={f('amount')} min={0} step={0.01} style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reference / Invoice No.</label>
              <input type="text" value={form.referenceNo} onChange={f('referenceNo')} placeholder="INV-2025-XXXX" style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Vendor / Payee</label>
              <input type="text" value={form.vendor} onChange={f('vendor')} placeholder="Vendor name" style={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Approval Status</label>
              <select value={form.approvalStatus} onChange={f('approvalStatus')} style={inp}>
                <option value="pending">⏳ Pending</option>
                <option value="approved">✅ Approved</option>
                <option value="rejected">❌ Rejected</option>
              </select>
            </div>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={f('notes')} rows={2} placeholder="Additional notes, purpose, or remarks..." style={{ ...inp, resize: 'vertical' }}/>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleSave(true)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all border border-slate-200">Save as Draft</button>
            <button onClick={() => handleSave(false)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}>Submit Entry</button>
          </div>
        </div>
      )}

      <div style={card}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#f1f5f9' }}>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-800">{filterCat === 'all' ? 'All Entries' : `${filterCat}s`}</h3>
            {filterCat !== 'all' && <button onClick={() => setFilterCat('all')} className="text-xs text-slate-400 hover:text-slate-600">Clear filter ×</button>}
          </div>
          <div className="text-sm font-bold" style={{ color: accentColor }}>Total: RM {totalAmount.toLocaleString()}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Description</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-right px-5 py-3 font-medium">Amount (RM)</th>
                <th className="text-left px-5 py-3 font-medium">Vendor</th>
                <th className="text-left px-5 py-3 font-medium">Approval</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">No entries yet.</td></tr>}
              {filtered.map((e, i) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: '#f1f5f9', color: '#64748b' }}>
                      {CATEGORY_ICONS[e.category]} {e.category}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-sm font-medium text-slate-700 max-w-xs truncate">{e.description}</div>
                    <div className="text-xs text-slate-400">{e.referenceNo}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{e.date}</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-800">{e.amount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate-600 max-w-xs truncate">{e.vendor || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={APPROVAL_STYLE[e.approvalStatus]}>{e.approvalStatus}</span>
                  </td>
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
