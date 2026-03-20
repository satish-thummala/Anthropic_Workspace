import React, { useState, useEffect } from 'react';
import type { ToastFn } from '../../types/compliance.types';
import {
  incidentAPI,
  type ApiIncident,
  type IncidentStats,
  type IncidentSeverity,
  type IncidentStatus,
  type IncidentType,
  type CreateIncidentRequest,
  type UpdateIncidentRequest,
} from '../../services/incident-api';
import { Icons } from '../../components/shared/Icons';

interface Props { toast: ToastFn; }

// ── Constants ─────────────────────────────────────────────────────────────────

const SEVERITY_META: Record<IncidentSeverity, { color: string; bg: string }> = {
  CRITICAL: { color: '#DC2626', bg: '#FEF2F2' },
  HIGH:     { color: '#EA580C', bg: '#FFF7ED' },
  MEDIUM:   { color: '#D97706', bg: '#FFFBEB' },
  LOW:      { color: '#16A34A', bg: '#F0FDF4' },
};

const STATUS_META: Record<IncidentStatus, { color: string; bg: string; label: string }> = {
  open:          { color: '#DC2626', bg: '#FEF2F2', label: 'Open' },
  investigating: { color: '#D97706', bg: '#FFFBEB', label: 'Investigating' },
  contained:     { color: '#2563EB', bg: '#EFF6FF', label: 'Contained' },
  resolved:      { color: '#16A34A', bg: '#F0FDF4', label: 'Resolved' },
  closed:        { color: '#64748B', bg: '#F8FAFC', label: 'Closed' },
};

const INCIDENT_TYPES = [
  { value: 'data_breach',         label: 'Data Breach' },
  { value: 'unauthorised_access', label: 'Unauthorised Access' },
  { value: 'malware',             label: 'Malware' },
  { value: 'phishing',            label: 'Phishing' },
  { value: 'policy_violation',    label: 'Policy Violation' },
  { value: 'system_outage',       label: 'System Outage' },
  { value: 'third_party_breach',  label: 'Third Party Breach' },
  { value: 'insider_threat',      label: 'Insider Threat' },
  { value: 'other',               label: 'Other' },
];

const STATUSES: IncidentStatus[] = ['open','investigating','contained','resolved','closed'];

// ── Helper components ─────────────────────────────────────────────────────────

function SevBadge({ s }: { s: string }) {
  const m = SEVERITY_META[s as IncidentSeverity] ?? { color: '#64748B', bg: '#F8FAFC' };
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: m.bg, color: m.color }}>{s}</span>;
}

function StatBadge({ s }: { s: string }) {
  const m = STATUS_META[s as IncidentStatus] ?? STATUS_META.open;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: m.bg, color: m.color }}>{m.label}</span>;
}

function Spinner() {
  return <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.15)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />;
}

// ── Markdown renderer (reused from PolicyGeneratorPage pattern) ───────────────
function MarkdownBlock({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('## '))  return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, margin: '16px 0 6px', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>{line.slice(3)}</h3>;
        if (line.startsWith('# '))   return <h2 key={i} style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: 'var(--accent)' }}>{line.slice(2)}</h2>;
        if (line.startsWith('### ')) return <h4 key={i} style={{ fontSize: 13, fontWeight: 700, margin: '12px 0 4px' }}>{line.slice(4)}</h4>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3 }}><span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span><span>{line.slice(2)}</span></div>;
        if (/^\d+\.\s/.test(line)) return <div key={i} style={{ marginBottom: 3 }}>{line}</div>;
        if (line.startsWith('> '))  return <div key={i} style={{ borderLeft: '3px solid var(--border)', paddingLeft: 12, color: 'var(--text2)', margin: '8px 0' }}>{line.slice(2)}</div>;
        if (line.startsWith('---')) return <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />;
        if (line.trim() === '')     return <div key={i} style={{ height: 6 }} />;
        if (line.startsWith('|'))   return null; // skip table lines in simple renderer
        return <p key={i} style={{ margin: '2px 0' }}>{line.replace(/\*\*/g, '')}</p>;
      })}
    </div>
  );
}

// ── Create modal ──────────────────────────────────────────────────────────────

function CreateModal({ onSave, onClose, toast }: { onSave: (i: ApiIncident) => void; onClose: () => void; toast: ToastFn }) {
  const [form, setForm] = useState<CreateIncidentRequest>({
    title: '', severity: 'MEDIUM', incidentType: 'other', personalDataInvolved: false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof CreateIncidentRequest, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    if (!form.title.trim()) { toast('Title is required', 'error'); return; }
    setSaving(true);
    try {
      const created = await incidentAPI.create(form);
      onSave(created);
      toast('Incident reported', 'success');
    } catch { toast('Failed to create incident', 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 28, width: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Report New Incident</h2>
          <button onClick={onClose} className="icon-btn"><Icons.X style={{ width: 16, height: 16 }} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Brief description of the incident"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Severity</label>
              <select value={form.severity} onChange={e => set('severity', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
                {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Type</label>
              <select value={form.incidentType} onChange={e => set('incidentType', e.target.value as IncidentType)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
                {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="What happened? What was the impact?"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Affected Systems</label>
            <input value={form.affectedSystems ?? ''} onChange={e => set('affectedSystems', e.target.value)}
              placeholder="e.g. CRM, Email Server, HR Portal"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Frameworks Affected</label>
              <input value={form.affectedFrameworks ?? ''} onChange={e => set('affectedFrameworks', e.target.value)}
                placeholder="ISO27001, GDPR, HIPAA"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Records Affected</label>
              <input type="number" value={form.recordsAffected ?? ''} onChange={e => set('recordsAffected', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={form.personalDataInvolved ?? false}
              onChange={e => set('personalDataInvolved', e.target.checked)} />
            <span><strong>Personal data involved</strong> — triggers GDPR/HIPAA notification obligations</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving ? <Spinner /> : <Icons.Check style={{ width: 14, height: 14 }} />}
            {saving ? 'Saving…' : 'Report Incident'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ incident, onUpdate, onClose, toast }: {
  incident: ApiIncident;
  onUpdate: (i: ApiIncident) => void;
  onClose: () => void;
  toast: ToastFn;
}) {
  const [form, setForm] = useState<UpdateIncidentRequest>({
    status:            incident.status,
    severity:          incident.severity,
    rootCause:         incident.rootCause ?? '',
    correctiveActions: incident.correctiveActions ?? '',
    lessonsLearned:    incident.lessonsLearned ?? '',
    regulatorNotified: incident.regulatorNotified,
    individualsNotified: incident.individualsNotified,
  });
  const [saving,      setSaving]      = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [narrative,   setNarrative]   = useState(incident.aiNarrative ?? '');

  const set = (k: keyof UpdateIncidentRequest, v: any) =>
    setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await incidentAPI.update(incident.id, form);
      onUpdate(updated);
      toast('Incident updated', 'success');
    } catch { toast('Failed to update incident', 'error'); }
    finally { setSaving(false); }
  }

  async function handleGenerateReport() {
    setGenerating(true);
    try {
      const result = await incidentAPI.generateReport(incident.id);
      setNarrative(result.text);
      onUpdate({ ...incident, aiNarrative: result.text });
      toast(`AI report generated via ${result.engine}`, 'success');
    } catch { toast('Failed to generate report', 'error'); }
    finally { setGenerating(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 12, width: 720, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <SevBadge s={incident.severity} />
              <StatBadge s={incident.status} />
              {incident.personalDataInvolved && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#FEF2F2', color: '#DC2626' }}>⚠ Personal Data</span>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{incident.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              Detected {incident.detectedAt ? new Date(incident.detectedAt).toLocaleDateString() : '—'}
              {incident.reportedByName && ` · Reported by ${incident.reportedByName}`}
            </div>
          </div>
          <button onClick={onClose} className="icon-btn"><Icons.X style={{ width: 16, height: 16 }} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Status + Severity row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Severity</label>
              <select value={form.severity} onChange={e => set('severity', e.target.value as IncidentSeverity)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}>
                {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Root cause */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Root Cause</label>
            <textarea value={form.rootCause ?? ''} onChange={e => set('rootCause', e.target.value)}
              rows={3} placeholder="What caused this incident?"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          {/* Corrective actions */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Corrective Actions</label>
            <textarea value={form.correctiveActions ?? ''} onChange={e => set('correctiveActions', e.target.value)}
              rows={3} placeholder="What actions have been or will be taken?"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          {/* Lessons learned */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Lessons Learned</label>
            <textarea value={form.lessonsLearned ?? ''} onChange={e => set('lessonsLearned', e.target.value)}
              rows={2} placeholder="What can be improved to prevent recurrence?"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          {/* Regulatory notifications */}
          {incident.personalDataInvolved && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 10 }}>⚠ Regulatory Notification Required</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.regulatorNotified ?? false}
                    onChange={e => set('regulatorNotified', e.target.checked)} />
                  <span>Supervisory authority notified (GDPR Art.33 — within 72 hours)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.individualsNotified ?? false}
                    onChange={e => set('individualsNotified', e.target.checked)} />
                  <span>Affected individuals notified (GDPR Art.34 / HIPAA)</span>
                </label>
              </div>
            </div>
          )}

          {/* AI Report */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>AI Incident Report</div>
              <button onClick={handleGenerateReport} disabled={generating}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                {generating ? <Spinner /> : <Icons.Zap style={{ width: 13, height: 13 }} />}
                {generating ? 'Generating…' : narrative ? 'Regenerate' : 'Generate Report'}
              </button>
            </div>
            {narrative ? (
              <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 16, maxHeight: 320, overflowY: 'auto' }}>
                <MarkdownBlock content={narrative} />
              </div>
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                Click "Generate Report" to create an AI-written formal incident report
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving ? <Spinner /> : <Icons.Check style={{ width: 14, height: 14 }} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function IncidentManagementPage({ toast }: Props) {
  const [incidents,    setIncidents]    = useState<ApiIncident[]>([]);
  const [stats,        setStats]        = useState<IncidentStats | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [showCreate,   setShowCreate]   = useState(false);
  const [selected,     setSelected]     = useState<ApiIncident | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSev,    setFilterSev]    = useState('');
  // Governance summary
  const [govSummary,   setGovSummary]   = useState('');
  const [govLoading,   setGovLoading]   = useState(false);
  const [showGov,      setShowGov]      = useState(false);

  useEffect(() => { load(); }, [filterStatus, filterSev]);

  async function load() {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        incidentAPI.getAll(filterStatus || undefined, filterSev || undefined),
        incidentAPI.getStats(),
      ]);
      setIncidents(list);
      setStats(s);
    } catch { toast('Failed to load incidents', 'error'); }
    finally { setLoading(false); }
  }

  async function handleGovernance() {
    setGovLoading(true);
    setShowGov(true);
    try {
      const result = await incidentAPI.getGovernanceSummary();
      setGovSummary(result.text);
    } catch { toast('Failed to get governance summary', 'error'); setShowGov(false); }
    finally { setGovLoading(false); }
  }

  function handleCreated(i: ApiIncident) {
    setIncidents(prev => [i, ...prev]);
    if (stats) setStats({ ...stats, total: stats.total + 1, active: stats.active + 1, open: stats.open + 1 });
    setShowCreate(false);
  }

  function handleUpdated(i: ApiIncident) {
    setIncidents(prev => prev.map(x => x.id === i.id ? i : x));
    setSelected(i);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this incident?')) return;
    try {
      await incidentAPI.delete(id);
      setIncidents(prev => prev.filter(i => i.id !== id));
      setSelected(null);
      toast('Incident deleted', 'success');
    } catch { toast('Failed to delete incident', 'error'); }
  }

  const active = incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed');

  return (
    <div className="slide-in">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Incident Management</h1>
          <p>Track, investigate, and report security and compliance incidents</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleGovernance} disabled={govLoading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {govLoading ? <Spinner /> : <Icons.Zap style={{ width: 14, height: 14 }} />}
            Governance Summary
          </button>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icons.AlertTriangle style={{ width: 14, height: 14 }} />
            Report Incident
          </button>
        </div>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
          {[
            { label: 'Total',        val: stats.total,               color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Active',       val: stats.active,              color: '#DC2626', bg: '#FEF2F2' },
            { label: 'Critical',     val: stats.critical,            color: '#EA580C', bg: '#FFF7ED' },
            { label: 'Investigating',val: stats.investigating,        color: '#D97706', bg: '#FFFBEB' },
            { label: 'Personal Data',val: stats.personalDataBreaches, color: '#7C3AED', bg: '#F5F3FF' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Governance summary panel */}
      {showGov && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>⚡ Governance Summary</div>
            <button onClick={() => setShowGov(false)} className="icon-btn">
              <Icons.X style={{ width: 14, height: 14 }} />
            </button>
          </div>
          {govLoading
            ? <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text3)' }}>Generating governance summary…</div>
            : <MarkdownBlock content={govSummary} />
          }
        </div>
      )}

      {/* Filters */}
      <div className="card section-gap" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
          <select value={filterSev} onChange={e => setFilterSev(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}>
            <option value="">All Severities</option>
            {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(filterStatus || filterSev) && (
            <button onClick={() => { setFilterStatus(''); setFilterSev(''); }}
              className="btn btn-secondary btn-sm">Clear</button>
          )}
          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>
            {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Incident list */}
      <div className="card">
        {loading && <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)' }}>Loading incidents…</div>}
        {!loading && incidents.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🛡️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No incidents recorded</div>
            <div style={{ fontSize: 13 }}>Click "Report Incident" when a security or compliance incident occurs.</div>
          </div>
        )}
        {!loading && incidents.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th style={{ width: 90 }}>Severity</th>
                  <th style={{ width: 110 }}>Type</th>
                  <th style={{ width: 110 }}>Status</th>
                  <th style={{ width: 120 }}>Detected</th>
                  <th style={{ width: 120 }}>Assigned To</th>
                  <th style={{ width: 80 }}>Data</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(inc)}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{inc.title}</div>
                      {inc.affectedSystems && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{inc.affectedSystems}</div>}
                    </td>
                    <td><SevBadge s={inc.severity} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                      {INCIDENT_TYPES.find(t => t.value === inc.incidentType)?.label ?? inc.incidentType}
                    </td>
                    <td><StatBadge s={inc.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                      {inc.detectedAt ? new Date(inc.detectedAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{inc.assignedToName ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {inc.personalDataInvolved
                        ? <span title="Personal data involved" style={{ fontSize: 14 }}>⚠️</span>
                        : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      <button className="icon-btn" title="Delete"
                        onClick={e => { e.stopPropagation(); handleDelete(inc.id); }}>
                        <Icons.Trash style={{ width: 14, height: 14, color: '#DC2626' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && <CreateModal onSave={handleCreated} onClose={() => setShowCreate(false)} toast={toast} />}
      {selected && (
        <DetailPanel
          incident={selected}
          onUpdate={handleUpdated}
          onClose={() => setSelected(null)}
          toast={toast}
        />
      )}
    </div>
  );
}
