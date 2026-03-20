import React, { useState, useEffect } from 'react';
import type { ToastFn, User } from '../../types/compliance.types';
import {
  sopAPI,
  type ApiSopTask,
  type TaskStatus,
} from '../../services/sop-api';
import { Icons } from '../../components/shared/Icons';

interface Props { toast: ToastFn; user?: User; }

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pending:      { label: 'Pending',      color: '#D97706', bg: '#FFFBEB' },
  acknowledged: { label: 'Acknowledged', color: '#16A34A', bg: '#F0FDF4' },
  approved:     { label: 'Approved',     color: '#16A34A', bg: '#F0FDF4' },
  rejected:     { label: 'Rejected',     color: '#DC2626', bg: '#FEF2F2' },
  overdue:      { label: 'Overdue',      color: '#DC2626', bg: '#FEF2F2' },
};

function StatusBadge({ s }: { s: TaskStatus }) {
  const m = STATUS_META[s] ?? STATUS_META.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px',
      borderRadius: 99, background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

function Spinner() {
  return <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.1)',
    borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block',
    animation: 'spin 0.7s linear infinite' }} />;
}

// ── Task detail + action modal ────────────────────────────────────────────────

function TaskModal({ task, onDone, onClose, toast }: {
  task: ApiSopTask;
  onDone: (updated: ApiSopTask) => void;
  onClose: () => void;
  toast: ToastFn;
}) {
  const [note,        setNote]        = useState('');
  const [acting,      setActing]      = useState(false);
  const [tab,         setTab]         = useState<'content' | 'action'>('content');
  const isDone = task.status === 'acknowledged' || task.status === 'approved'
              || task.status === 'rejected';

  async function handleAcknowledge() {
    setActing(true);
    try {
      const updated = await sopAPI.acknowledge(task.id, note || undefined);
      onDone(updated);
      toast('SOP acknowledged — thank you!', 'success');
      onClose();
    } catch { toast('Failed to acknowledge — please try again', 'error'); }
    finally { setActing(false); }
  }

  async function handleApprove(approved: boolean) {
    if (!approved && !note.trim()) {
      toast('Please provide a reason for rejection', 'error'); return;
    }
    setActing(true);
    try {
      const updated = await sopAPI.approve(task.id, approved, note || undefined);
      onDone(updated);
      toast(approved ? 'SOP approved' : 'SOP rejected', 'success');
      onClose();
    } catch { toast('Failed — please try again', 'error'); }
    finally { setActing(false); }
  }

  const daysLeft = task.daysUntilDue;
  const urgent   = daysLeft <= 1 && !isDone;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 680, maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header" style={{ marginBottom: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <StatusBadge s={task.status as TaskStatus} />
              {task.isOverdue && !isDone && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626',
                  background: '#FEF2F2', padding: '3px 8px', borderRadius: 99 }}>
                  OVERDUE
                </span>
              )}
              {urgent && !task.isOverdue && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706',
                  background: '#FFFBEB', padding: '3px 8px', borderRadius: 99 }}>
                  DUE SOON
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{task.sopTitle}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              Version {task.sopVersion}
              {task.assignedByName && ` · Assigned by ${task.assignedByName}`}
              {' · '}Due {new Date(task.dueDate).toLocaleDateString()}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <Icons.X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 16, marginBottom: 16,
          borderBottom: '1px solid var(--border)' }}>
          {(['content', 'action'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600,
                fontFamily: 'var(--font)', cursor: 'pointer', border: 'none',
                background: 'none', borderBottom: tab === t
                  ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab === t ? 'var(--accent)' : 'var(--text3)',
                transition: 'all 0.15s' }}>
              {t === 'content' ? '📄 Policy Content' : '✍️ Sign Off'}
            </button>
          ))}
        </div>

        {/* Content tab */}
        {tab === 'content' && (
          <div style={{ maxHeight: 380, overflowY: 'auto',
            padding: '0 4px', fontSize: 13, lineHeight: 1.7, color: 'var(--text)' }}>
            {task.sopContent ? (
              <div>
                {task.sopContent.split('\n').map((line, i) => {
                  if (line.startsWith('# '))
                    return <h2 key={i} style={{ fontSize: 17, fontWeight: 700,
                      margin: '16px 0 8px', color: 'var(--accent)' }}>{line.slice(2)}</h2>;
                  if (line.startsWith('## '))
                    return <h3 key={i} style={{ fontSize: 14, fontWeight: 700,
                      margin: '14px 0 6px', borderBottom: '1px solid var(--border)',
                      paddingBottom: 4 }}>{line.slice(3)}</h3>;
                  if (line.startsWith('### '))
                    return <h4 key={i} style={{ fontSize: 13, fontWeight: 700,
                      margin: '10px 0 4px' }}>{line.slice(4)}</h4>;
                  if (line.startsWith('- ') || line.startsWith('* '))
                    return <div key={i} style={{ display: 'flex', gap: 8,
                      marginBottom: 3 }}><span style={{ color: 'var(--accent)',
                      flexShrink: 0 }}>•</span><span>{line.slice(2)}</span></div>;
                  if (/^\d+\.\s/.test(line))
                    return <div key={i} style={{ marginBottom: 3, paddingLeft: 4 }}>{line}</div>;
                  if (line.startsWith('---'))
                    return <hr key={i} style={{ border: 'none',
                      borderTop: '1px solid var(--border)', margin: '12px 0' }} />;
                  if (line.trim() === '')
                    return <div key={i} style={{ height: 6 }} />;
                  return <p key={i} style={{ margin: '2px 0' }}>
                    {line.replace(/\*\*(.*?)\*\*/g, (_, t) => t)}
                  </p>;
                })}
              </div>
            ) : (
              <div style={{ padding: '30px 0', textAlign: 'center',
                color: 'var(--text3)' }}>
                No policy content available.
              </div>
            )}
          </div>
        )}

        {/* Sign off tab */}
        {tab === 'action' && (
          <div>
            {isDone ? (
              <div style={{ padding: '20px',
                background: task.status === 'rejected' ? '#FEF2F2' : '#F0FDF4',
                borderRadius: 10, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700,
                  color: task.status === 'rejected' ? '#DC2626' : '#16A34A',
                  marginBottom: 6 }}>
                  {task.status === 'rejected' ? '✗ Rejected' : '✓ Completed'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  {task.signedAt && `Signed on ${new Date(task.signedAt).toLocaleString()}`}
                  {task.signatureNote && ` — "${task.signatureNote}"`}
                  {task.rejectionReason && ` — Reason: ${task.rejectionReason}`}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: 'var(--accent-light)', border: '1px solid #BFDBFE',
                  borderRadius: 9, padding: 14, marginBottom: 16, fontSize: 13,
                  lineHeight: 1.5 }}>
                  {task.taskType === 'approve' ? (
                    <>By clicking <strong>Approve</strong>, you confirm you have reviewed
                    this document and formally approve it. If you have concerns, click
                    <strong> Reject</strong> with a reason.</>
                  ) : (
                    <>By clicking <strong>I Acknowledge</strong>, you confirm that you
                    have read and understood the contents of <strong>{task.sopTitle}</strong>
                    {' '}and agree to comply with its requirements.</>
                  )}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)',
                    textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 }}>
                    {task.taskType === 'approve' ? 'Note (required for rejection)' : 'Optional Note'}
                  </label>
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    rows={3}
                    placeholder={task.taskType === 'approve'
                      ? 'Add your comments…'
                      : 'Any comments or questions? (optional)'}
                    style={{ width: '100%', padding: '9px 12px',
                      border: '1.5px solid var(--border)', borderRadius: 7,
                      fontSize: 13, fontFamily: 'var(--font)', resize: 'vertical' as const,
                      boxSizing: 'border-box' as const, outline: 'none' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            {isDone ? 'Close' : 'Read Later'}
          </button>
          {!isDone && tab === 'action' && (
            task.taskType === 'approve' ? (
              <>
                <button onClick={() => handleApprove(false)} disabled={acting}
                  className="btn btn-danger btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {acting ? <Spinner /> : <Icons.X style={{ width: 13, height: 13 }} />}
                  Reject
                </button>
                <button onClick={() => handleApprove(true)} disabled={acting}
                  className="btn btn-primary btn-sm"
                  style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {acting ? <Spinner /> : <Icons.Check style={{ width: 13, height: 13 }} />}
                  Approve
                </button>
              </>
            ) : (
              <button onClick={handleAcknowledge} disabled={acting}
                className="btn btn-primary btn-sm"
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                {acting ? <Spinner /> : <Icons.Check style={{ width: 13, height: 13 }} />}
                {acting ? 'Signing…' : 'I Acknowledge'}
              </button>
            )
          )}
          {!isDone && tab === 'content' && (
            <button onClick={() => setTab('action')}
              className="btn btn-primary btn-sm"
              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              Continue to Sign Off →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Employee Portal page ─────────────────────────────────────────────────

export function EmployeePortalPage({ toast, user }: Props) {
  const [tasks,        setTasks]        = useState<ApiSopTask[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedTask, setSelectedTask] = useState<ApiSopTask | null>(null);
  const [filter,       setFilter]       = useState<'all' | 'pending' | 'done'>('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await sopAPI.getMyTasks();
      setTasks(data);
    } catch { toast('Failed to load your tasks', 'error'); }
    finally { setLoading(false); }
  }

  function handleTaskDone(updated: ApiSopTask) {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  }

  const pending  = tasks.filter(t => t.status === 'pending' || t.status === 'overdue');
  const done     = tasks.filter(t => t.status === 'acknowledged' || t.status === 'approved' || t.status === 'rejected');
  const overdue  = pending.filter(t => t.isOverdue || t.status === 'overdue');

  const filtered = filter === 'pending' ? pending
                 : filter === 'done'    ? done
                 : tasks;

  return (
    <div className="slide-in">

      {/* Welcome header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Compliance Tasks</h1>
          <p>
            {user?.name && `Welcome, ${user.name.split(' ')[0]}. `}
            Review and acknowledge your assigned policies and SOPs.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total Assigned', val: tasks.length,   color: '#1D4ED8', bg: '#EFF6FF' },
          { label: 'Pending',        val: pending.length,  color: '#D97706', bg: '#FFFBEB' },
          { label: 'Overdue',        val: overdue.length,  color: '#DC2626', bg: '#FEF2F2' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
          padding: '14px 18px', marginBottom: 20, display: 'flex',
          alignItems: 'center', gap: 12 }}>
          <Icons.AlertTriangle style={{ width: 18, height: 18, color: '#DC2626',
            flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>
              {overdue.length} overdue task{overdue.length !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 13, color: '#991B1B' }}>
              Please complete these tasks as soon as possible to maintain compliance.
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16,
        borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {([
          { key: 'all',     label: `All (${tasks.length})` },
          { key: 'pending', label: `Pending (${pending.length})` },
          { key: 'done',    label: `Completed (${done.length})` },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font)', cursor: 'pointer', border: 'none',
              background: 'none',
              borderBottom: filter === tab.key
                ? '2px solid var(--accent)' : '2px solid transparent',
              color: filter === tab.key ? 'var(--accent)' : 'var(--text3)',
              transition: 'all 0.15s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)' }}>
            Loading your tasks…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)' }}>
              {filter === 'pending' ? 'No pending tasks!' : 'No tasks here.'}
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {filter === 'pending'
                ? 'You\'re all caught up. Check back when new policies are assigned.'
                : 'Tasks assigned to you will appear here.'}
            </div>
          </div>
        )}

        {!loading && filtered.map(task => {
          const isDone  = task.status === 'acknowledged' || task.status === 'approved'
                       || task.status === 'rejected';
          const isUrgent = !isDone && task.daysUntilDue <= 1 && !task.isOverdue;
          const meta    = STATUS_META[task.status as TaskStatus] ?? STATUS_META.pending;

          return (
            <div key={task.id}
              style={{ background: 'var(--surface)', border: '1px solid',
                borderColor: task.isOverdue && !isDone ? '#FECACA'
                           : isUrgent ? '#FDE68A' : 'var(--border)',
                borderLeft: `4px solid ${
                  task.isOverdue && !isDone ? '#DC2626'
                  : isUrgent ? '#D97706'
                  : isDone ? '#16A34A'
                  : 'var(--accent)'}`,
                borderRadius: 'var(--radius)', padding: '16px 18px',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: 'var(--shadow)' }}
              onClick={() => setSelectedTask(task)}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow)')}>

              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center',
                    marginBottom: 4, flexWrap: 'wrap' as const }}>
                    <StatusBadge s={task.status as TaskStatus} />
                    {task.isOverdue && !isDone && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626',
                        background: '#FEF2F2', padding: '2px 7px', borderRadius: 99 }}>
                        OVERDUE
                      </span>
                    )}
                    {isUrgent && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706',
                        background: '#FFFBEB', padding: '2px 7px', borderRadius: 99 }}>
                        DUE TOMORROW
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text3)',
                      background: 'var(--surface2)', padding: '2px 7px',
                      borderRadius: 5, fontFamily: 'var(--mono)' }}>
                      {task.taskType === 'approve' ? 'APPROVAL' : 'ACKNOWLEDGE'}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>
                    {task.sopTitle}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    v{task.sopVersion}
                    {task.assignedByName && ` · Assigned by ${task.assignedByName}`}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600,
                    color: task.isOverdue && !isDone ? '#DC2626'
                         : isUrgent ? '#D97706' : 'var(--text3)' }}>
                    {isDone ? 'Completed' : (
                      task.daysUntilDue < 0 ? `${Math.abs(task.daysUntilDue)}d overdue`
                      : task.daysUntilDue === 0 ? 'Due today'
                      : `${task.daysUntilDue}d left`
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                  {!isDone && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--accent)',
                        fontWeight: 600 }}>
                        Click to {task.taskType === 'approve' ? 'review & approve' : 'acknowledge'} →
                      </span>
                    </div>
                  )}
                  {isDone && task.signedAt && (
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                      {new Date(task.signedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {task.signatureNote && (
                <div style={{ marginTop: 10, padding: '8px 12px',
                  background: 'var(--surface2)', borderRadius: 7,
                  fontSize: 12, color: 'var(--text2)',
                  borderLeft: '3px solid var(--border)' }}>
                  Your note: "{task.signatureNote}"
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Task modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onDone={handleTaskDone}
          onClose={() => setSelectedTask(null)}
          toast={toast}
        />
      )}
    </div>
  );
}
