import React, { useState } from 'react';
import type { GapDetectionResponse, FrameworkAnalysisResult, ControlMatchResult } from '../../services/gap-detection-api';

interface Props {
  result: GapDetectionResponse;
  onClose: () => void;
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function severityColor(confidence: number): string {
  if (confidence >= 80) return '#16A34A';
  if (confidence >= 50) return '#D97706';
  return '#DC2626';
}

function coverageColor(pct: number): string {
  if (pct >= 70) return '#16A34A';
  if (pct >= 40) return '#D97706';
  return '#DC2626';
}

function CoverageBar({ pct, height = 6 }: { pct: number; height?: number }) {
  return (
    <div style={{ flex: 1, height, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: 99,
        background: coverageColor(pct),
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

// ── Framework accordion row ───────────────────────────────────────────────────

function FrameworkRow({ fw }: { fw: FrameworkAnalysisResult }) {
  const [open, setOpen] = useState(false);

  const gaps    = fw.controls.filter(c => !c.covered);
  const covered = fw.controls.filter(c => c.covered);

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      {/* Header row — click to expand */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 16px',
          background: 'var(--surface2)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Framework name */}
        <div style={{ fontWeight: 700, fontSize: 13, minWidth: 220, color: 'var(--text)' }}>
          {fw.frameworkName}
        </div>

        {/* Coverage bar */}
        <CoverageBar pct={fw.coveragePercentage} height={8} />

        {/* Pct label */}
        <div style={{ fontWeight: 700, fontSize: 13, color: coverageColor(fw.coveragePercentage), minWidth: 40, textAlign: 'right' }}>
          {fw.coveragePercentage}%
        </div>

        {/* Stats pills */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#F0FDF4', color: '#16A34A' }}>
            ✓ {fw.coveredControls}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#FEF2F2', color: '#DC2626' }}>
            ✗ {fw.gapsCreated} gap{fw.gapsCreated !== 1 ? 's' : ''} created
          </span>
        </div>

        {/* Chevron */}
        <div style={{ fontSize: 12, color: 'var(--text3)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </div>
      </div>

      {/* Expanded control list */}
      {open && (
        <div style={{ padding: '0 16px 12px' }}>
          {fw.controls.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No controls loaded for this framework
            </div>
          ) : (
            <>
              {/* Gaps first, then covered */}
              {[...gaps, ...covered].map(ctrl => (
                <ControlRow key={ctrl.controlId} ctrl={ctrl} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Individual control row ────────────────────────────────────────────────────

function ControlRow({ ctrl }: { ctrl: ControlMatchResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
        padding: '9px 0',
        cursor: ctrl.matchedKeywords.length > 0 ? 'pointer' : 'default',
      }}
      onClick={() => ctrl.matchedKeywords.length > 0 && setExpanded(e => !e)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Covered / gap indicator */}
        <div style={{
          width: 20, height: 20, borderRadius: 99, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
          background: ctrl.covered ? '#F0FDF4' : '#FEF2F2',
          color: ctrl.covered ? '#16A34A' : '#DC2626',
        }}>
          {ctrl.covered ? '✓' : '✗'}
        </div>

        {/* Control code */}
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
          color: 'var(--text2)', minWidth: 80,
        }}>
          {ctrl.controlCode}
        </span>

        {/* Control title */}
        <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>
          {ctrl.controlTitle}
        </span>

        {/* Confidence badge */}
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, flexShrink: 0,
          background: ctrl.covered ? '#EFF6FF' : '#FFF7ED',
          color: ctrl.covered ? '#1D4ED8' : '#EA580C',
        }}>
          {ctrl.confidence}%
        </span>
      </div>

      {/* Expanded keywords */}
      {expanded && ctrl.matchedKeywords.length > 0 && (
        <div style={{ paddingLeft: 30, paddingTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 4 }}>Matched:</span>
          {ctrl.matchedKeywords.map(kw => (
            <span key={kw} style={{
              fontSize: 11, padding: '1px 6px', borderRadius: 4,
              background: '#EFF6FF', color: '#1D4ED8', fontFamily: 'var(--mono)',
            }}>
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function GapDetectionResultsPanel({ result, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'gaps' | 'all'>('gaps');

  const s = result.summary;
  const gapFrameworks  = (result.frameworks ?? []).filter(fw => fw.gapsCreated > 0);
  const allFrameworks  = result.frameworks ?? [];

  return (
    <div style={{
      marginTop: 0,
      border: '1.5px solid #1D4ED830',
      borderRadius: 12,
      overflow: 'hidden',
      background: 'var(--surface)',
    }}>
      {/* ── Title bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px',
        background: 'linear-gradient(135deg, #1D4ED810 0%, #7C3AED08 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 16 }}>🔍</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
            Gap Analysis — {result.documentName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
            {result.message}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text3)', fontSize: 18, lineHeight: 1,
            padding: '2px 6px', borderRadius: 4,
          }}
          title="Close"
        >
          ×
        </button>
      </div>

      {/* ── Summary cards ── */}
      {s && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderBottom: '1px solid var(--border)' }}>
          {[
            { label: 'Controls Checked', val: s.totalControls,      color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Controls Covered', val: s.coveredControls,    color: '#16A34A', bg: '#F0FDF4' },
            { label: 'Gaps Detected',    val: s.gapsDetected,       color: '#DC2626', bg: '#FEF2F2' },
            { label: 'Coverage',         val: `${s.coveragePercentage}%`, color: coverageColor(s.coveragePercentage), bg: '#FAFAFA' },
          ].map(card => (
            <div key={card.label} style={{
              padding: '14px 18px',
              borderRight: '1px solid var(--border)',
              background: card.bg,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>{card.val}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontWeight: 600 }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
        {[
          { id: 'gaps' as const, label: `Gaps Created (${gapFrameworks.length} frameworks affected)` },
          { id: 'all'  as const, label: `All Frameworks (${allFrameworks.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text3)',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Framework list ── */}
      <div style={{ padding: 16 }}>
        {(activeTab === 'gaps' ? gapFrameworks : allFrameworks).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)' }}>
            {activeTab === 'gaps'
              ? '🎉 No gaps detected — all controls in detected frameworks are covered!'
              : 'No frameworks were analyzed.'}
          </div>
        ) : (
          (activeTab === 'gaps' ? gapFrameworks : allFrameworks).map(fw => (
            <FrameworkRow key={fw.frameworkId} fw={fw} />
          ))
        )}

        {/* Note about gaps being saved */}
        {s && s.gapsDetected > 0 && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            background: '#FFFBEB', border: '1px solid #FDE68A',
            fontSize: 12, color: '#92400E',
          }}>
            ℹ️ <strong>{s.gapsDetected} gap{s.gapsDetected !== 1 ? 's' : ''}</strong> have been saved to the Gaps module.
            Existing open gaps were not duplicated.
            Go to <strong>Gaps</strong> in the sidebar to assign, prioritise, and track remediation.
          </div>
        )}
      </div>
    </div>
  );
}
