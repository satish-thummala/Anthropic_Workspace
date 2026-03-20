// ============================================================================
// CORRECTED ReportsPage.tsx - WITH BACKEND INTEGRATION
// ============================================================================
// Location: src/features/Reports/ReportsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import type { 
  ToastFn, 
  ApiReport, 
  ApiReportTypeInfo 
} from '../../types/compliance.types';
import { reportAPI } from '../../services/report-api';
import { STATUS_MAP } from '../../constants/statusMaps';
import { Icons } from '../../components/shared/Icons';

interface Props { toast: ToastFn; }

interface ProgressStep { label: string; state: 'done' | 'active' | 'pending'; }

export function ReportsPage({ toast }: Props) {
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [reportTypes, setReportTypes] = useState<ApiReportTypeInfo[]>([]);
  const [selected, setSelected] = useState('gap');
  const [generating, setGenerating] = useState(false);
  const [modal, setModal] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Load reports and types ────────────────────────────────────────────────
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [allReports, types] = await Promise.all([
        reportAPI.getAll(),
        reportAPI.getTypes()
      ]);
      setReports(allReports);
      setReportTypes(types);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  // ── Generate report ───────────────────────────────────────────────────────
  async function generateReport() {
    setGenerating(true);
    setModal(true);

    // Show progress steps
    const stepLabels = [
      'Scanning ingested documents…',
      'Mapping to frameworks…',
      'Identifying control gaps…',
      'Calculating risk scores…',
      'Generating report…'
    ];
    setSteps(stepLabels.map((s, i) => ({ 
      label: s, 
      state: i === 0 ? 'active' : 'pending' 
    })));

    try {
      // Call backend to generate report
      const result = await reportAPI.generate({
        type: selected as any,
        format: 'PDF',
        includeCharts: true,
        includeDetails: true
      });

      // Animate progress steps
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

      // Poll for completion (in production, use WebSocket or Server-Sent Events)
      await pollForCompletion(result.reportId);

      // Reload reports list
      await loadReports();

      toast('Report generated successfully!', 'success');
    } catch (err: any) {
      console.error('Report generation failed:', err);
      toast('Failed to generate report', 'error');
    } finally {
      setGenerating(false);
      setModal(false);
    }
  }

  // ── Poll for report completion ────────────────────────────────────────────
  async function pollForCompletion(reportId: string, maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const report = await reportAPI.getById(reportId);
      
      if (report.status === 'ready') {
        return;
      }
      if (report.status === 'failed') {
        throw new Error(report.errorMessage || 'Report generation failed');
      }
    }
    throw new Error('Report generation timed out');
  }

  // ── Download report ───────────────────────────────────────────────────────
  async function handleDownload(report: ApiReport) {
    try {
      toast(`Building Word document…`, 'info');
      await reportAPI.download(report.id, report.name);
      toast(`${report.name} downloaded as .docx`, 'success');
    } catch (err) {
      toast('Download failed — report may still be generating', 'error');
    }
  }

  // ── Delete report ─────────────────────────────────────────────────────────
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    
    try {
      await reportAPI.delete(id);
      setReports(prev => prev.filter(r => r.id !== id));
      toast('Report deleted', 'success');
    } catch (err) {
      toast('Failed to delete report', 'error');
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading && reports.length === 0) {
    return (
      <div className="slide-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⟳</div>
          <div>Loading reports…</div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="slide-in">
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#DC2626' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠</div>
          <div style={{ fontWeight: 600 }}>Failed to load reports</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{error}</div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={loadReports}>
            Retry
          </button>
        </div>
      </div>
    );
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
        <div className="card-desc" style={{ marginBottom: 20 }}>
          Select a report type and generate an audit-ready document
        </div>
        <div className="gen-report-grid">
          {reportTypes.map((rt) => (
            <div
              key={rt.id}
              className={`gen-report-option${selected === rt.id ? ' selected' : ''}`}
              onClick={() => setSelected(rt.id)}
            >
              <div className="gen-report-option-icon"><Icons.Report /></div>
              <div className="gen-report-option-title">{rt.label}</div>
              <div className="gen-report-option-desc">{rt.description}</div>
            </div>
          ))}
        </div>
        <button
          className="btn btn-primary"
          style={{ width: 'auto' }}
          onClick={generateReport}
          disabled={generating}
        >
          {generating ? 'Generating…' : (
            <>
              <Icons.Zap style={{ width: 14, height: 14 }} /> Generate Report
            </>
          )}
        </button>
      </div>

      {/* Reports List */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 20 }}>
          Generated Reports ({reports.length})
        </div>
        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
            <Icons.FileText style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.3 }} />
            <div>No reports generated yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Select a report type above and click "Generate Report"
            </div>
          </div>
        ) : (
          reports.map((r) => {
            const st = STATUS_MAP[r.status] ?? STATUS_MAP.ready;
            return (
              <div key={r.id} className="report-item">
                <div className="report-icon"><Icons.FileText /></div>
                <div style={{ flex: 1 }}>
                  <div className="report-name">{r.name}</div>
                  <div className="report-meta">
                    {r.type.toUpperCase()} &bull; {r.format} &bull; {r.fileSizeLabel} &bull; 
                    Generated {new Date(r.generatedAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="badge" style={{ background: st.bg, color: st.color }}>
                  {st.label}
                </span>
                <div className="report-actions">
                  {r.status === 'ready' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownload(r)}
                    >
                      <Icons.Download style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDelete(r.id, r.name)}
                  >
                    <Icons.Trash style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Progress Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => !generating && setModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              Generating Report…
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    background: step.state === 'done' ? '#16A34A' : step.state === 'active' ? '#3B82F6' : '#E2E8F0',
                    color: step.state !== 'pending' ? 'white' : '#64748B',
                  }}>
                    {step.state === 'done' ? '✓' : i + 1}
                  </div>
                  <div style={{
                    flex: 1,
                    fontSize: 14,
                    color: step.state !== 'pending' ? 'var(--text)' : 'var(--text3)',
                  }}>
                    {step.label}
                  </div>
                  {step.state === 'active' && (
                    <div className="spin" style={{
                      width: 14,
                      height: 14,
                      border: '2px solid #3B82F6',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
