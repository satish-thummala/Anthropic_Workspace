import React, { useState } from 'react';
import type { ToastFn, ComplianceGap } from '../../types/compliance.types';
import { INITIAL_GAPS, FRAMEWORKS } from '../../constants/mockData';
import { SEV_COLORS, SEV_BG, STATUS_MAP } from '../../constants/statusMaps';
import { Icons } from '../../components/shared/Icons';

interface GapsPageProps { toast: ToastFn; }

export function GapsPage({ toast }: GapsPageProps) {
  const [gaps, setGaps]         = useState<ComplianceGap[]>(INITIAL_GAPS);
  const [search, setSearch]     = useState('');
  const [sevFilter, setSevFilter] = useState('all');
  const [fwFilter, setFwFilter]   = useState('all');
  const [analyzing, setAnalyzing] = useState(false);

  async function runAnalysis() {
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 2200));
    setAnalyzing(false);
    toast('Gap analysis complete — 7 gaps identified', 'success');
  }

  function updateStatus(id: number, status: ComplianceGap['status']) {
    setGaps((g) => g.map((gap) => gap.id === id ? { ...gap, status } : gap));
    toast('Gap status updated', 'success');
  }

  const filtered = gaps.filter((g) => {
    const mSearch = g.title.toLowerCase().includes(search.toLowerCase()) || g.control.toLowerCase().includes(search.toLowerCase());
    const mSev    = sevFilter === 'all' || g.severity === sevFilter;
    const mFw     = fwFilter  === 'all' || g.framework === fwFilter;
    return mSearch && mSev && mFw;
  });

  const counts = {
    CRITICAL: gaps.filter((g) => g.severity === 'CRITICAL').length,
    HIGH:     gaps.filter((g) => g.severity === 'HIGH').length,
    MEDIUM:   gaps.filter((g) => g.severity === 'MEDIUM').length,
    LOW:      gaps.filter((g) => g.severity === 'LOW').length,
  };

  return (
    <div className="slide-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Compliance Gap Analysis</h1>
          <p>Identified control gaps across all mapped frameworks and documents</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={runAnalysis} disabled={analyzing}>
          {analyzing
            ? <span className="spin" style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
            : <Icons.Zap style={{ width: 14, height: 14 }} />}
          {analyzing ? ' Analyzing…' : ' Run Gap Analysis'}
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {(Object.entries(counts) as [string, number][]).map(([sev, count]) => (
          <div
            key={sev}
            className="stat-card"
            style={{ cursor: 'pointer', borderTop: `3px solid ${SEV_COLORS[sev as keyof typeof SEV_COLORS]}` }}
            onClick={() => setSevFilter(sev === sevFilter ? 'all' : sev)}
          >
            <div style={{ fontSize: 26, fontWeight: 800, color: SEV_COLORS[sev as keyof typeof SEV_COLORS] }}>{count}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{sev} Severity</div>
          </div>
        ))}
      </div>

      <div className="search-bar section-gap">
        <div className="search-input-wrap">
          <Icons.Search />
          <input className="search-input" placeholder="Search gaps by title or control ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
          <option value="all">All Severities</option>
          {['CRITICAL','HIGH','MEDIUM','LOW'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={fwFilter} onChange={(e) => setFwFilter(e.target.value)}>
          <option value="all">All Frameworks</option>
          {FRAMEWORKS.map((f) => <option key={f.code} value={f.code}>{f.name}</option>)}
        </select>
      </div>

      {filtered.map((gap) => {
        const st = STATUS_MAP[gap.status];
        return (
          <div key={gap.id} className="gap-item" style={{ borderLeftColor: SEV_COLORS[gap.severity] }}>
            <div className="gap-header">
              <span className="gap-control">{gap.control}</span>
              <div style={{ flex: 1 }}>
                <div className="gap-title">{gap.title}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 5, alignItems: 'center' }}>
                  <span className="fw-badge">{gap.framework}</span>
                  <span className="badge" style={{ background: SEV_BG[gap.severity], color: SEV_COLORS[gap.severity], fontSize: 11 }}>{gap.severity}</span>
                  <span className="badge" style={{ background: st.bg, color: st.color, fontSize: 11 }}>{st.label}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {gap.status !== 'resolved' && (
                  <button className="btn btn-secondary btn-sm" style={{ fontSize: 12 }} onClick={() => updateStatus(gap.id, gap.status === 'open' ? 'in_progress' : 'resolved')}>
                    {gap.status === 'open' ? 'Start' : 'Resolve'}
                  </button>
                )}
                {gap.status === 'resolved' && <Icons.Check style={{ width: 18, height: 18, color: '#16A34A', marginTop: 4 }} />}
              </div>
            </div>
            <p className="gap-desc">{gap.description}</p>
            <div className="gap-suggestion">
              <div className="gap-suggestion-label">Recommended Action</div>
              <div className="gap-suggestion-text">{gap.suggestion}</div>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Icons.Check style={{ width: 40, height: 40, color: '#16A34A', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>No gaps found matching your filters</div>
          <div style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>Try adjusting your search criteria</div>
        </div>
      )}
    </div>
  );
}
