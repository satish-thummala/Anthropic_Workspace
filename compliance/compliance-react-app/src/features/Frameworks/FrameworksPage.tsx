import React, { useState, useMemo } from 'react';
import type { ToastFn, ApiFrameworkDetail, ApiFrameworkSummary, ApiControl } from '../../types/compliance.types';
import { useFrameworks, useFrameworkDetail } from '../../hooks/useFrameworks';
import { frameworkAPI, mapAllDocuments } from '../../services/framework-api';
import type { MappingResult } from '../../services/framework-api';
import { SEV_COLORS, SEV_BG } from '../../constants/statusMaps';
import { Icons } from '../../components/shared/Icons';

interface Props { toast: ToastFn; }

// ─── MAPPING PROGRESS MODAL ───────────────────────────────────────────────────

function MappingModal({ result }: { result: MappingResult }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: 32, width: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '1px solid var(--border)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Check style={{ width: 20, height: 20, color: '#059669' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Mapping Complete</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>All documents processed successfully</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Documents',        value: result.documentsProcessed, color: '#3B82F6', bg: '#EFF6FF' },
            { label: 'Controls Updated', value: result.controlsUpdated,    color: '#059669', bg: '#D1FAE5' },
            { label: 'Already Covered',  value: result.controlsAlreadyCovered, color: '#6B7280', bg: '#F3F4F6' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '14px 8px', background: s.bg, borderRadius: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Frameworks affected */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>FRAMEWORKS UPDATED</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {result.frameworksAffected.map(code => (
              <span key={code} style={{
                padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)',
              }}>{code}</span>
            ))}
          </div>
        </div>

        {/* Summary message */}
        <div style={{
          padding: '12px 16px', background: 'var(--surface2)', borderRadius: 8,
          border: '1px solid var(--border)', fontSize: 13, color: 'var(--text2)',
        }}>
          {result.summary}
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL VIEW ──────────────────────────────────────────────────────────────

function FrameworkDetailView({
  detail, onBack, onCoverageToggle, toast,
}: {
  detail: ApiFrameworkDetail;
  onBack: () => void;
  onCoverageToggle: (control: ApiControl) => void;
  toast: ToastFn;
}) {
  const [search,     setSearch]   = useState('');
  const [catFilter,  setCat]      = useState('');
  const [sevFilter,  setSev]      = useState('');
  const [covFilter,  setCov]      = useState<'all' | 'covered' | 'gap'>('all');
  const [togglingId, setToggling] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(detail.controls.map(c => c.category).filter(Boolean) as string[])].sort(),
    [detail.controls]
  );

  const filtered = useMemo(() => detail.controls.filter(c => {
    if (search    && !`${c.code} ${c.title}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && c.category !== catFilter)  return false;
    if (sevFilter && c.severity !== sevFilter)  return false;
    if (covFilter === 'covered' && !c.isCovered) return false;
    if (covFilter === 'gap'     &&  c.isCovered) return false;
    return true;
  }), [detail.controls, search, catFilter, sevFilter, covFilter]);

  async function handleToggle(control: ApiControl) {
    setToggling(control.id);
    try {
      const updated = await frameworkAPI.updateCoverage(detail.code, control.id, !control.isCovered);
      onCoverageToggle(updated);
      toast(`${control.code} marked as ${updated.isCovered ? 'covered' : 'gap'}`, 'success');
    } catch {
      toast('Failed to update coverage', 'error');
    } finally {
      setToggling(null);
    }
  }

  const gaps = detail.totalControls - detail.coveredControls;

  return (
    <div className="slide-in">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: 8 }}>&larr; Back</button>
          <h1>{detail.name} <span style={{ color: 'var(--text2)', fontWeight: 500 }}>({detail.version})</span></h1>
          <p>{detail.description} &bull; {detail.totalControls} total controls</p>
        </div>
      </div>

      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Coverage Summary</div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            {[
              { label: 'Overall Coverage', val: `${detail.coveragePercentage}%`, bg: `${detail.color}18`, border: `${detail.color}40`, color: detail.color },
              { label: 'Controls Covered', val: String(detail.coveredControls),  bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A' },
              { label: 'Gaps Found',       val: String(gaps),                    bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' },
            ].map(m => (
              <div key={m.label} style={{ flex: 1, textAlign: 'center', padding: 16, background: m.bg, borderRadius: 10, border: `1px solid ${m.border}` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.val}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div className="coverage-bar-track" style={{ height: 12 }}>
            <div className="coverage-bar-fill" style={{ width: `${detail.coveragePercentage}%`, background: detail.color }} />
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text2)' }}>By Severity</div>
            {detail.bySeverity.map(s => (
              <div key={s.severity} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ width: 70, fontSize: 11, fontWeight: 700, color: SEV_COLORS[s.severity as keyof typeof SEV_COLORS] }}>{s.severity}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--surface2)' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: SEV_COLORS[s.severity as keyof typeof SEV_COLORS], width: `${s.total ? Math.round((s.covered / s.total) * 100) : 0}%` }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text3)', width: 80, textAlign: 'right' }}>
                  {s.covered}/{s.total} &bull; {s.gaps} gap{s.gaps !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Coverage by Category</div>
          {detail.byCategory.map(cat => (
            <div key={cat.category} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{cat.category}</span>
                <span style={{ color: detail.color, fontWeight: 700 }}>{cat.coveragePercentage}%</span>
              </div>
              <div className="coverage-bar-track">
                <div className="coverage-bar-fill" style={{ width: `${cat.coveragePercentage}%`, background: detail.color }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{cat.covered} of {cat.total} controls covered</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="card-title" style={{ flex: 1 }}>Controls ({filtered.length})</div>
          <input type="text" placeholder="Search code or title…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13, width: 190 }} />
          <select value={catFilter} onChange={e => setCat(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13 }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sevFilter} onChange={e => setSev(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13 }}>
            <option value="">All Severities</option>
            {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={covFilter} onChange={e => setCov(e.target.value as any)}
            style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13 }}>
            <option value="all">All</option>
            <option value="covered">Covered</option>
            <option value="gap">Gaps only</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 100 }}>Code</th><th>Title</th><th>Category</th>
                <th style={{ width: 90 }}>Severity</th><th style={{ width: 90, textAlign: 'center' }}>Covered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>No controls match filters</td></tr>
              )}
              {filtered.map(ctrl => (
                <tr key={ctrl.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                      {ctrl.code}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{ctrl.title}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{ctrl.category ?? '—'}</td>
                  <td>
                    <span className="badge" style={{ background: SEV_BG[ctrl.severity], color: SEV_COLORS[ctrl.severity], fontSize: 11 }}>
                      {ctrl.severity}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggle(ctrl)}
                      disabled={togglingId === ctrl.id}
                      style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: ctrl.isCovered ? '#D1FAE5' : 'var(--surface2)',
                        color:      ctrl.isCovered ? '#059669' : 'var(--text3)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        opacity: togglingId === ctrl.id ? 0.5 : 1,
                      }}
                      title={ctrl.isCovered ? 'Mark as gap' : 'Mark as covered'}
                    >
                      {ctrl.isCovered ? <Icons.Check style={{ width: 14, height: 14 }} /> : <Icons.X style={{ width: 14, height: 14 }} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── LIST VIEW ────────────────────────────────────────────────────────────────

export function FrameworksPage({ toast }: Props) {
  const { frameworks, loading, error, setFrameworks } = useFrameworks();
  const [selectedCode,  setSelectedCode]  = useState<string | null>(null);
  const [mapping,       setMapping]       = useState(false);
  const [mappingResult, setMappingResult] = useState<MappingResult | null>(null);
  const [mappingStage,  setMappingStage]  = useState('');

  const { detail, loading: detailLoading, error: detailError, updateControlLocally } = useFrameworkDetail(selectedCode);

  // ── Map All Documents ──────────────────────────────────────────────────────
  async function handleMapAllDocuments() {
    setMapping(true);
    setMappingStage('Scanning documents…');

    // Staged progress messages for UX
    const stages = [
      { msg: 'Scanning documents…',          delay: 0    },
      { msg: 'Extracting policy content…',   delay: 600  },
      { msg: 'Matching controls…',           delay: 1400 },
      { msg: 'Updating coverage scores…',    delay: 2200 },
    ];
    stages.forEach(s => setTimeout(() => setMappingStage(s.msg), s.delay));

    try {
      const result = await mapAllDocuments();

      // Update the framework cards in place with fresh data from the API
      setFrameworks(result.updatedFrameworks);
      setMappingResult(result);
      toast(result.summary, 'success');

      // Auto-dismiss the modal after 4 seconds
      setTimeout(() => setMappingResult(null), 4000);
    } catch (e: any) {
      toast(e?.response?.data?.message ?? 'Mapping failed — please try again', 'error');
    } finally {
      setMapping(false);
      setMappingStage('');
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="slide-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⟳</div>
          <div>Loading frameworks…</div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="slide-in">
        <div className="card" style={{ textAlign: 'center', padding: 40, color: '#DC2626' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠</div>
          <div style={{ fontWeight: 600 }}>Failed to load frameworks</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{error}</div>
        </div>
      </div>
    );
  }

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selectedCode) {
    if (detailLoading || !detail) {
      return (
        <div className="slide-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⟳</div>
            <div>Loading details…</div>
          </div>
        </div>
      );
    }
    if (detailError) {
      return (
        <div className="slide-in">
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCode(null)} style={{ marginBottom: 16 }}>&larr; Back</button>
          <div className="card" style={{ color: '#DC2626' }}>Failed to load: {detailError}</div>
        </div>
      );
    }
    return (
      <FrameworkDetailView
        detail={detail}
        onBack={() => setSelectedCode(null)}
        onCoverageToggle={updateControlLocally}
        toast={toast}
      />
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="slide-in">
      {/* Success modal */}
      {mappingResult && <MappingModal result={mappingResult} />}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Compliance Frameworks</h1>
          <p>Map your documents to regulatory standards and track coverage</p>
        </div>

        {/* Map All Documents button — with live progress state */}
        <button
          className="btn btn-primary btn-sm"
          onClick={handleMapAllDocuments}
          disabled={mapping}
          style={{ minWidth: 180, position: 'relative', opacity: mapping ? 0.85 : 1 }}
        >
          {mapping ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 13, height: 13, border: '2px solid rgba(255,255,255,0.35)',
                borderTopColor: 'white', borderRadius: '50%',
                display: 'inline-block', animation: 'spin 0.7s linear infinite',
              }} />
              {mappingStage || 'Mapping…'}
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icons.Zap style={{ width: 14, height: 14 }} /> Map All Documents
            </span>
          )}
        </button>
      </div>

      {/* Framework cards */}
      <div className="fw-cards">
        {frameworks.map((fw: ApiFrameworkSummary) => (
          <div
            key={fw.code}
            className="fw-card"
            style={{ borderLeftColor: fw.color, cursor: 'pointer' }}
            onClick={() => !mapping && setSelectedCode(fw.code)}
          >
            <div className="fw-card-header">
              <div>
                <span className="fw-card-code" style={{ background: `${fw.color}18`, color: fw.color }}>{fw.code}</span>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>v{fw.version}</div>
              </div>
              <div className="fw-card-pct" style={{ color: fw.color }}>{fw.coveragePercentage}%</div>
            </div>
            <div className="fw-card-name">{fw.name}</div>
            <div className="fw-card-desc">{fw.description}</div>
            <div className="coverage-bar-track">
              <div className="coverage-bar-fill" style={{ width: `${fw.coveragePercentage}%`, background: fw.color }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
              <span>{fw.coveredControls}/{fw.totalControls} controls</span>
              <span style={{ color: fw.color, fontWeight: 600 }}>View Details &rarr;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
