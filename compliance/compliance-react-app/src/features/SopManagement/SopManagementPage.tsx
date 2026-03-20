import React, { useState, useEffect } from 'react';
import type { ToastFn } from '../../types/compliance.types';
import {
  sopAPI,
  type ApiSopDocument,
  type ApiSopTask,
  type SopStats,
  type EmployeeInfo,
  type CreateSopRequest,
  type SopCategory,
} from '../../services/sop-api';
import { Icons } from '../../components/shared/Icons';

interface Props { toast: ToastFn; }

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { value: SopCategory; label: string }[] = [
  { value: 'security_policy',    label: 'Security Policy' },
  { value: 'data_protection',    label: 'Data Protection' },
  { value: 'acceptable_use',     label: 'Acceptable Use' },
  { value: 'incident_response',  label: 'Incident Response' },
  { value: 'access_control',     label: 'Access Control' },
  { value: 'business_continuity',label: 'Business Continuity' },
  { value: 'hr_policy',          label: 'HR Policy' },
  { value: 'other',              label: 'Other' },
];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending:      { color: '#D97706', bg: '#FFFBEB' },
  acknowledged: { color: '#16A34A', bg: '#F0FDF4' },
  approved:     { color: '#16A34A', bg: '#F0FDF4' },
  rejected:     { color: '#DC2626', bg: '#FEF2F2' },
  overdue:      { color: '#DC2626', bg: '#FEF2F2' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ s }: { s: string }) {
  const m = STATUS_STYLE[s] ?? { color: '#64748B', bg: '#F8FAFC' };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px',
      borderRadius: 99, background: m.bg, color: m.color }}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

function Spinner() {
  return <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.1)',
    borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block',
    animation: 'spin 0.7s linear infinite' }} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    display: 'block', marginBottom: 5 }}>{children}</label>;
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--border)', borderRadius: 7, fontSize: 13,
    fontFamily: 'var(--font)', color: 'var(--text)', background: 'var(--surface)',
    boxSizing: 'border-box' as const, outline: 'none', ...props.style }} />;
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--border)', borderRadius: 7, fontSize: 13,
    fontFamily: 'var(--font)', color: 'var(--text)', background: 'var(--surface)',
    boxSizing: 'border-box' as const, resize: 'vertical' as const, outline: 'none',
    ...props.style }} />;
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--border)', borderRadius: 7, fontSize: 13,
    fontFamily: 'var(--font)', color: 'var(--text)', background: 'var(--surface)',
    boxSizing: 'border-box' as const, outline: 'none', cursor: 'pointer',
    ...props.style }}>{children}</select>;
}

// ── Create / Edit SOP Modal ───────────────────────────────────────────────────

function SopFormModal({ sop, onSave, onClose, toast }: {
  sop: ApiSopDocument | null;
  onSave: (s: ApiSopDocument) => void;
  onClose: () => void;
  toast: ToastFn;
}) {
  const isEdit = sop !== null;
  const [form, setForm] = useState<CreateSopRequest>({
    title:            sop?.title            ?? '',
    description:      sop?.description      ?? '',
    version:          sop?.version          ?? '1.0',
    category:         sop?.category         ?? 'security_policy',
    content:          sop?.content          ?? '',
    frameworkCodes:   sop?.frameworkCodes   ?? '',
    dueDays:          sop?.dueDays          ?? 7,
    requiresApproval: sop?.requiresApproval ?? false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof CreateSopRequest, v: any) =>
    setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    if (!form.title.trim()) { toast('Title is required', 'error'); return; }
    setSaving(true);
    try {
      const result = isEdit
        ? await sopAPI.update(sop!.id, form)
        : await sopAPI.create(form);
      onSave(result);
      toast(isEdit ? 'SOP updated' : 'SOP created', 'success');
    } catch { toast('Failed to save SOP', 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit SOP' : 'Create New SOP'}</span>
          <button className="modal-close" onClick={onClose}>
            <Icons.X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Access Control Policy v2.1" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>Version</Label>
              <Input value={form.version} onChange={e => set('version', e.target.value)}
                placeholder="1.0" />
            </div>
            <div>
              <Label>Due (days)</Label>
              <Input type="number" value={form.dueDays}
                onChange={e => set('dueDays', parseInt(e.target.value) || 7)}
                min={1} max={90} />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief summary of this policy…" />
          </div>

          <div>
            <Label>Framework Codes</Label>
            <Input value={form.frameworkCodes ?? ''}
              onChange={e => set('frameworkCodes', e.target.value)}
              placeholder="e.g. ISO27001, GDPR, HIPAA" />
          </div>

          <div>
            <Label>Policy Content (Markdown)</Label>
            <Textarea rows={8} value={form.content ?? ''}
              onChange={e => set('content', e.target.value)}
              style={{ fontFamily: 'var(--mono)', fontSize: 12 }}
              placeholder="# Policy Title&#10;&#10;## 1. Purpose&#10;&#10;## 2. Scope&#10;&#10;## 3. Policy Statement…" />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={form.requiresApproval ?? false}
              onChange={e => set('requiresApproval', e.target.checked)} />
            <span>Requires formal approval (not just acknowledgement)</span>
          </label>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="btn btn-primary btn-sm"
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving ? <Spinner /> : <Icons.Check style={{ width: 14, height: 14 }} />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create SOP'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Assign Modal ──────────────────────────────────────────────────────────────

function AssignModal({ sop, employees, onClose, toast }: {
  sop: ApiSopDocument;
  employees: EmployeeInfo[];
  onClose: () => void;
  toast: ToastFn;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [taskType, setTaskType] = useState<'acknowledge' | 'approve'>('acknowledge');
  const [dueDate, setDueDate]   = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + sop.dueDays);
    return d.toISOString().split('T')[0];
  });
  const [saving, setSaving] = useState(false);

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(employees.map(e => e.id)));
  }

  async function handleAssign() {
    if (selected.size === 0) { toast('Select at least one employee', 'error'); return; }
    setSaving(true);
    try {
      const tasks = await sopAPI.assignTasks(sop.id, {
        employeeIds: Array.from(selected),
        taskType,
        dueDate,
      });
      toast(`Assigned to ${tasks.length} employee(s)`, 'success');
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to assign tasks', 'error');
    } finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 540 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Assign SOP to Employees</span>
          <button className="modal-close" onClick={onClose}>
            <Icons.X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{ marginBottom: 14, padding: '10px 14px',
          background: 'var(--accent-light)', borderRadius: 8, fontSize: 13 }}>
          <strong>{sop.title}</strong>
          <span style={{ color: 'var(--text2)', marginLeft: 8 }}>v{sop.version}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <Label>Task Type</Label>
            <Select value={taskType} onChange={e => setTaskType(e.target.value as any)}>
              <option value="acknowledge">Acknowledge (read & confirm)</option>
              <option value="approve">Formal Approval (approve/reject)</option>
            </Select>
          </div>
          <div>
            <Label>Due Date</Label>
            <Input type="date" value={dueDate}
              onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 10, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>Select Employees</Label>
          <button onClick={selectAll}
            style={{ fontSize: 12, color: 'var(--accent)', background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
            Select all
          </button>
        </div>

        {employees.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text3)',
            fontSize: 13 }}>
            No employee accounts found. Add employees in the database.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6,
            maxHeight: 280, overflowY: 'auto' }}>
            {employees.map(emp => (
              <label key={emp.id} style={{ display: 'flex', alignItems: 'center',
                gap: 10, padding: '10px 12px', border: '1.5px solid',
                borderColor: selected.has(emp.id) ? 'var(--accent)' : 'var(--border)',
                borderRadius: 8, cursor: 'pointer',
                background: selected.has(emp.id) ? 'var(--accent-light)' : 'var(--surface)',
                transition: 'all 0.15s' }}>
                <input type="checkbox" checked={selected.has(emp.id)}
                  onChange={() => toggle(emp.id)}
                  style={{ cursor: 'pointer' }} />
                <div style={{ width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {emp.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{emp.email}</div>
                </div>
                {emp.pendingTaskCount > 0 && (
                  <span style={{ fontSize: 11, color: '#D97706',
                    background: '#FFFBEB', padding: '2px 7px',
                    borderRadius: 99, fontWeight: 600 }}>
                    {emp.pendingTaskCount} pending
                  </span>
                )}
              </label>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={handleAssign} disabled={saving || selected.size === 0}
            className="btn btn-primary btn-sm"
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving ? <Spinner /> : <Icons.Check style={{ width: 14, height: 14 }} />}
            {saving ? 'Assigning…' : `Assign to ${selected.size} employee${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tasks Panel ───────────────────────────────────────────────────────────────

function TasksPanel({ sop, onClose }: { sop: ApiSopDocument; onClose: () => void }) {
  const [tasks, setTasks] = useState<ApiSopTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sopAPI.getTasksBySop(sop.id)
      .then(setTasks).finally(() => setLoading(false));
  }, [sop.id]);

  const ack  = tasks.filter(t => t.status === 'acknowledged' || t.status === 'approved').length;
  const pct  = tasks.length > 0 ? Math.round((ack / tasks.length) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 660 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{sop.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              v{sop.version} · Completion: {pct}% ({ack}/{tasks.length})
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <Icons.X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 99,
          marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99,
            background: pct === 100 ? 'var(--success)' : 'var(--accent)',
            width: `${pct}%`, transition: 'width 0.5s ease' }} />
        </div>

        {loading ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text3)' }}>
            Loading assignments…
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text3)',
            fontSize: 13 }}>
            No employees assigned yet. Use "Assign to Employees" to get started.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{t.assignedToName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.assignedToEmail}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                      {t.taskType === 'acknowledge' ? 'Acknowledge' :
                       t.taskType === 'approve'     ? 'Approve'     : 'Training'}
                    </td>
                    <td><StatusBadge s={t.status} /></td>
                    <td style={{ fontSize: 12, color: t.isOverdue ? 'var(--danger)' : 'var(--text2)' }}>
                      {new Date(t.dueDate).toLocaleDateString()}
                      {t.isOverdue && <span style={{ marginLeft: 4, fontSize: 10 }}>OVERDUE</span>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                      {t.signedAt ? new Date(t.signedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function SopManagementPage({ toast }: Props) {
  const [sops,        setSops]        = useState<ApiSopDocument[]>([]);
  const [employees,   setEmployees]   = useState<EmployeeInfo[]>([]);
  const [stats,       setStats]       = useState<SopStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [editingSop,  setEditingSop]  = useState<ApiSopDocument | null>(null);
  const [assigningSop,setAssigningSop]= useState<ApiSopDocument | null>(null);
  const [viewingTasks,setViewingTasks]= useState<ApiSopDocument | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [sopList, empList, s] = await Promise.all([
        sopAPI.getAll(),
        sopAPI.getEmployees(),
        sopAPI.getStats(),
      ]);
      setSops(sopList);
      setEmployees(empList);
      setStats(s);
    } catch { toast('Failed to load SOP data', 'error'); }
    finally { setLoading(false); }
  }

  function handleSaved(saved: ApiSopDocument) {
    setSops(prev => {
      const idx = prev.findIndex(s => s.id === saved.id);
      return idx >= 0
        ? prev.map(s => s.id === saved.id ? saved : s)
        : [saved, ...prev];
    });
    setShowCreate(false);
    setEditingSop(null);
    load(); // refresh stats
  }

  async function handleDelete(sop: ApiSopDocument) {
    if (!confirm(`Delete "${sop.title}"? All task assignments will also be removed.`)) return;
    try {
      await sopAPI.delete(sop.id);
      setSops(prev => prev.filter(s => s.id !== sop.id));
      toast('SOP deleted', 'success');
      load();
    } catch { toast('Failed to delete SOP', 'error'); }
  }

  async function handleToggleActive(sop: ApiSopDocument) {
    try {
      const updated = await sopAPI.update(sop.id, { isActive: !sop.isActive });
      setSops(prev => prev.map(s => s.id === sop.id ? updated : s));
      toast(updated.isActive ? 'SOP activated' : 'SOP deactivated', 'success');
    } catch { toast('Failed to update SOP', 'error'); }
  }

  return (
    <div className="slide-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>SOP Management</h1>
          <p>Create policies, assign to employees, and track acknowledgements</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary"
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.Check style={{ width: 14, height: 14 }} />
          New SOP
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
          {[
            { label: 'Total SOPs',     val: stats.totalSops,         color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Active',         val: stats.activeSops,        color: '#16A34A', bg: '#F0FDF4' },
            { label: 'Pending Tasks',  val: stats.pendingTasks,      color: '#D97706', bg: '#FFFBEB' },
            { label: 'Overdue',        val: stats.overdueTasks,      color: '#DC2626', bg: '#FEF2F2' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* SOP table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)' }}>
            Loading SOPs…
          </div>
        ) : sops.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>
              No SOPs yet
            </div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>
              Create your first SOP and assign it to employees for acknowledgement.
            </div>
            <button onClick={() => setShowCreate(true)} className="btn btn-primary"
              style={{ width: 'auto', display: 'inline-flex' }}>
              Create First SOP
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th style={{ width: 70 }}>Version</th>
                  <th style={{ width: 100 }}>Assigned</th>
                  <th style={{ width: 110 }}>Completion</th>
                  <th style={{ width: 80 }}>Status</th>
                  <th style={{ width: 130 }}></th>
                </tr>
              </thead>
              <tbody>
                {sops.map(sop => {
                  const pct = sop.totalAssigned > 0
                    ? Math.round((sop.totalAcknowledged / sop.totalAssigned) * 100) : 0;
                  return (
                    <tr key={sop.id}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{sop.title}</div>
                        {sop.frameworkCodes && (
                          <div style={{ marginTop: 3 }}>
                            {sop.frameworkCodes.split(',').map(fw => (
                              <span key={fw.trim()} className="fw-badge">{fw.trim()}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                        {CATEGORIES.find(c => c.value === sop.category)?.label ?? sop.category}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>v{sop.version}</td>
                      <td style={{ fontSize: 13 }}>{sop.totalAssigned}</td>
                      <td>
                        {sop.totalAssigned > 0 ? (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between',
                              fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>
                              <span>{sop.totalAcknowledged}/{sop.totalAssigned}</span>
                              <span style={{ fontWeight: 600,
                                color: pct === 100 ? 'var(--success)' : 'var(--text2)' }}>
                                {pct}%
                              </span>
                            </div>
                            <div style={{ height: 5, background: 'var(--border)',
                              borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 99,
                                background: pct === 100 ? 'var(--success)' : 'var(--accent)',
                                width: `${pct}%`, transition: 'width 0.4s' }} />
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Not assigned</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px',
                          borderRadius: 99,
                          background: sop.isActive ? '#F0FDF4' : '#F8FAFC',
                          color: sop.isActive ? '#16A34A' : '#64748B' }}>
                          {sop.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="td-actions">
                          <button className="icon-btn" title="View assignments"
                            onClick={() => setViewingTasks(sop)}>
                            <Icons.Eye style={{ width: 13, height: 13 }} />
                          </button>
                          <button className="icon-btn" title="Assign to employees"
                            onClick={() => setAssigningSop(sop)}
                            style={{ color: 'var(--accent)' }}>
                            <Icons.Check style={{ width: 13, height: 13 }} />
                          </button>
                          <button className="icon-btn" title="Edit"
                            onClick={() => setEditingSop(sop)}>
                            <Icons.FileText style={{ width: 13, height: 13 }} />
                          </button>
                          <button className="icon-btn" title="Delete"
                            onClick={() => handleDelete(sop)}>
                            <Icons.Trash style={{ width: 13, height: 13, color: '#DC2626' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <SopFormModal sop={null} onSave={handleSaved}
          onClose={() => setShowCreate(false)} toast={toast} />
      )}
      {editingSop && (
        <SopFormModal sop={editingSop} onSave={handleSaved}
          onClose={() => setEditingSop(null)} toast={toast} />
      )}
      {assigningSop && (
        <AssignModal sop={assigningSop} employees={employees}
          onClose={() => { setAssigningSop(null); load(); }} toast={toast} />
      )}
      {viewingTasks && (
        <TasksPanel sop={viewingTasks} onClose={() => setViewingTasks(null)} />
      )}
    </div>
  );
}
