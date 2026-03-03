import React, { useState } from 'react';
import type { ToastFn } from '../../types/compliance.types';
import { FRAMEWORKS, INITIAL_DOCUMENTS, INITIAL_GAPS } from '../../constants/mockData';
import { SEV_COLORS, SEV_BG } from '../../constants/statusMaps';
import { coveragePct } from '../../utils/complianceUtils';
import { Icons } from '../../components/shared/Icons';

interface FrameworksPageProps { toast: ToastFn; }

export function FrameworksPage({ toast }: FrameworksPageProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [mapping, setMapping]   = useState<string | null>(null);

  async function runMapping(code: string, name: string) {
    setMapping(code);
    await new Promise((r) => setTimeout(r, 1800));
    setMapping(null);
    toast(`Document mapping to ${name} completed`, 'success');
  }

  if (selected) {
    const fw  = FRAMEWORKS.find((f) => f.code === selected)!;
    const pct = coveragePct(fw);
    const relatedGaps = INITIAL_GAPS.filter((g) => g.framework === fw.code);
    return (
      <div className="slide-in">
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)} style={{ marginBottom: 8 }}>&larr; Back</button>
            <h1>{fw.name} <span style={{ color: 'var(--text2)', fontWeight: 500 }}>({fw.version})</span></h1>
            <p>{fw.description} &bull; {fw.controls} total controls</p>
          </div>
        </div>
        <div className="grid-2 section-gap">
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Coverage Summary</div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              {[
                { label: 'Overall Coverage', val: `${pct}%`,                    bg: `${fw.color}18`, border: `${fw.color}40`, color: fw.color },
                { label: 'Controls Covered', val: String(fw.covered),           bg: '#F0FDF4',       border: '#BBF7D0',       color: '#16A34A' },
                { label: 'Gaps Found',        val: String(fw.controls - fw.covered), bg: '#FEF2F2',  border: '#FECACA',       color: '#DC2626' },
              ].map((m) => (
                <div key={m.label} style={{ flex: 1, textAlign: 'center', padding: 16, background: m.bg, borderRadius: 10, border: `1px solid ${m.border}` }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div className="coverage-bar-track" style={{ height: 12 }}>
              <div className="coverage-bar-fill" style={{ width: `${pct}%`, background: fw.color }} />
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => runMapping(fw.code, fw.name)}>
              {mapping === fw.code ? 'Mapping…' : <><Icons.Zap style={{ width: 13, height: 13 }} /> Re-map Documents</>}
            </button>
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Related Gaps</div>
            {relatedGaps.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13 }}>No gaps found for this framework.</p>}
            {relatedGaps.map((g) => (
              <div key={g.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                <span className="gap-control" style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', background: 'var(--surface2)', padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border)', flexShrink: 0 }}>{g.control}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{g.title}</div>
                  <span className="badge" style={{ background: SEV_BG[g.severity], color: SEV_COLORS[g.severity], marginTop: 4, fontSize: 11 }}>{g.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Compliance Frameworks</h1>
          <p>Map your documents to regulatory standards and track coverage</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => toast('Framework mapping initiated for all documents', 'info')}>
          <Icons.Zap style={{ width: 14, height: 14 }} /> Map All Documents
        </button>
      </div>

      <div className="fw-cards">
        {FRAMEWORKS.map((fw) => {
          const pct = coveragePct(fw);
          return (
            <div key={fw.code} className="fw-card" style={{ borderLeftColor: fw.color }} onClick={() => setSelected(fw.code)}>
              <div className="fw-card-header">
                <div>
                  <span className="fw-card-code" style={{ background: `${fw.color}18`, color: fw.color }}>{fw.code}</span>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>v{fw.version}</div>
                </div>
                <div className="fw-card-pct" style={{ color: fw.color }}>{pct}%</div>
              </div>
              <div className="fw-card-name">{fw.name}</div>
              <div className="fw-card-desc">{fw.description}</div>
              <div className="coverage-bar-track">
                <div className="coverage-bar-fill" style={{ width: `${pct}%`, background: fw.color }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
                <span>{fw.covered}/{fw.controls} controls</span>
                <span style={{ color: fw.color, fontWeight: 600 }}>View Details &rarr;</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 4 }}>Document &rarr; Framework Mapping</div>
        <div className="card-desc" style={{ marginBottom: 16 }}>Which documents are mapped to which frameworks</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                {FRAMEWORKS.map((f) => <th key={f.code}>{f.code}</th>)}
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_DOCUMENTS.filter((d) => d.status === 'analyzed').map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 500 }}>{doc.name}</td>
                  {FRAMEWORKS.map((f) => (
                    <td key={f.code}>
                      {doc.frameworks.includes(f.code)
                        ? <Icons.Check style={{ width: 16, height: 16, color: '#16A34A' }} />
                        : <Icons.X    style={{ width: 16, height: 16, color: 'var(--text3)' }} />}
                    </td>
                  ))}
                  <td>
                    <span style={{ fontWeight: 700, color: (doc.coverageScore ?? 0) >= 80 ? '#16A34A' : (doc.coverageScore ?? 0) >= 60 ? '#D97706' : '#DC2626' }}>
                      {doc.coverageScore}%
                    </span>
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
