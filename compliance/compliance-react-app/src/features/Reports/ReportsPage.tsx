import React, { useState } from 'react';
import type { ToastFn, ComplianceReport } from '../../types/compliance.types';
import { INITIAL_REPORTS } from '../../constants/mockData';
import { STATUS_MAP } from '../../constants/statusMaps';
import { Icons } from '../../components/shared/Icons';

interface ReportsPageProps { toast: ToastFn; }

interface ReportType { id: string; label: string; desc: string; }

const REPORT_TYPES: ReportType[] = [
  { id: 'gap',       label: 'Gap Analysis Report',    desc: 'Full gap summary with remediation suggestions' },
  { id: 'coverage',  label: 'Coverage Report',         desc: 'Framework-by-framework compliance coverage' },
  { id: 'risk',      label: 'Risk Assessment',         desc: 'Risk scoring with trend analysis' },
  { id: 'audit',     label: 'Audit Trail',             desc: 'Evidence summary for auditor review' },
  { id: 'policy',    label: 'Policy Update Summary',   desc: 'Suggested policy improvements' },
  { id: 'executive', label: 'Executive Summary',       desc: 'High-level compliance posture overview' },
];

interface ProgressStep { label: string; state: 'done' | 'active' | 'pending'; }

export function ReportsPage({ toast }: ReportsPageProps) {
  const [reports, setReports]   = useState<ComplianceReport[]>(INITIAL_REPORTS);
  const [selected, setSelected] = useState('gap');
  const [generating, setGenerating] = useState(false);
  const [modal, setModal]       = useState(false);
  const [steps, setSteps]       = useState<ProgressStep[]>([]);

  async function generateReport() {
    setGenerating(true);
    setModal(true);
    const stepLabels = ['Scanning ingested documents…','Mapping to frameworks…','Identifying control gaps…','Calculating risk scores…','Generating report…'];
    setSteps(stepLabels.map((s, i) => ({ label: s, state: i === 0 ? 'active' : 'pending' })));
    for (let i = 0; i < stepLabels.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setSteps((prev) =>
        prev.map((s, idx) => ({
          ...s,
          state: idx <= i ? 'done' : idx === i + 1 ? 'active' : 'pending',
        }))
      );
    }
    await new Promise((r) => setTimeout(r, 400));
    const typeMeta = REPORT_TYPES.find((t) => t.id === selected)!;
    setReports((r) => [{
      id: Date.now(),
      name: `${typeMeta.label} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      generated: new Date().toISOString().split('T')[0],
      type: typeMeta.label,
      format: 'PDF',
      size: `${(0.5 + Math.random() * 2).toFixed(1)} MB`,
      status: 'ready',
    }, ...r]);
    setGenerating(false);
    setModal(false);
    toast('Report generated successfully!', 'success');
  }

  return (
    <div className="slide-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports &amp; Exports</h1>
          <p>Generate compliance gap reports, coverage summaries, and audit-ready documentation</p>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="card section-gap">
        <div className="card-title" style={{ marginBottom: 4 }}>Generate New Report</div>
        <div className="card-desc" style={{ marginBottom: 20 }}>Select a report type and generate an audit-ready document</div>
        <div className="gen-report-grid">
          {REPORT_TYPES.map((rt) => (
            <div key={rt.id} className={`gen-report-option${selected === rt.id ? ' selected' : ''}`} onClick={() => setSelected(rt.id)}>
              <div className="gen-report-option-icon"><Icons.Report /></div>
              <div className="gen-report-option-title">{rt.label}</div>
              <div className="gen-report-option-desc">{rt.desc}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={generateReport} disabled={generating}>
          {generating ? 'Generating…' : <><Icons.Zap style={{ width: 14, height: 14 }} /> Generate Report</>}
        </button>
      </div>

      {/* Reports List */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 20 }}>Generated Reports ({reports.length})</div>
        {reports.map((r) => {
          const st = STATUS_MAP[r.status] ?? STATUS_MAP.ready;
          return (
            <div key={r.id} className="report-item">
              <div className="report-icon"><Icons.FileText /></div>
              <div style={{ flex: 1 }}>
                <div className="report-name">{r.name}</div>
                <div className="report-meta">{r.type} &bull; {r.format} &bull; {r.size} &bull; Generated {r.generated}</div>
              </div>
              <span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
              <div className="report-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => toast(`Downloading ${r.name}…`, 'info')}>
                  <Icons.Download style={{ width: 13, height: 13 }} /> Download
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generation Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Generating Report…</div>
            </div>
            {steps.map((s, i) => (
              <div key={i} className="progress-step">
                <div className={`step-circle step-${s.state}`}>
                  {s.state === 'done' ? <Icons.Check style={{ width: 12, height: 12 }} /> : i + 1}
                </div>
                <span className={`step-text${s.state === 'done' ? ' done' : ''}`}>{s.label}</span>
                {s.state === 'active' && (
                  <span className="spin" style={{ width: 12, height: 12, border: '2px solid #E2E8F0', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block', marginLeft: 'auto' }} />
                )}
              </div>
            ))}
            <div className="loading-bar" style={{ marginTop: 8 }} />
          </div>
        </div>
      )}
    </div>
  );
}
