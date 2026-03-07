import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import type { ToastFn, ApiRiskScore, ApiRiskHistory } from '../../types/compliance.types';
import { riskAPI, type RiskIntelligenceResponse, type RiskAlert } from '../../services/risk-api';
import { SEV_COLORS, SEV_BG } from '../../constants/statusMaps';
import { Icons } from '../../components/shared/Icons';

interface Props { toast: ToastFn; }

const RISK_COLORS: Record<string, string> = {
  LOW:      '#22C55E',
  MEDIUM:   '#F59E0B',
  HIGH:     '#EF4444',
  CRITICAL: '#7C2D12',
};

const RISK_BG: Record<string, string> = {
  LOW:      '#F0FDF4',
  MEDIUM:   '#FFFBEB',
  HIGH:     '#FEF2F2',
  CRITICAL: '#FFF1EE',
};

const ALERT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  critical: { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
  warning:  { bg: '#FFFBEB', color: '#D97706', border: '#FCD34D' },
  info:     { bg: '#EFF6FF', color: '#2563EB', border: '#93C5FD' },
};

export function RiskPage({ toast }: Props) {
  const [score,       setScore]       = useState<ApiRiskScore | null>(null);
  const [history,     setHistory]     = useState<ApiRiskHistory | null>(null);
  const [intelligence, setIntelligence] = useState<RiskIntelligenceResponse | null>(null);
  const [loadingScore, setLoadingScore] = useState(true);
  const [loadingHist,  setLoadingHist]  = useState(true);
  const [loadingIntel, setLoadingIntel] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const loadScore = useCallback(async () => {
    try {
      setLoadingScore(true);
      setError(null);
      setScore(await riskAPI.getScore());
    } catch {
      setError('Failed to load risk score');
    } finally {
      setLoadingScore(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setLoadingHist(true);
      setHistory(await riskAPI.getHistory());
    } finally {
      setLoadingHist(false);
    }
  }, []);

  const loadIntelligence = useCallback(async () => {
    try {
      setLoadingIntel(true);
      setIntelligence(await riskAPI.getIntelligence());
    } catch (err) {
      console.error('Failed to load risk intelligence:', err);
      // Don't block page if intelligence fails
    } finally {
      setLoadingIntel(false);
    }
  }, []);

  useEffect(() => { 
    loadScore(); 
    loadHistory(); 
    loadIntelligence();
  }, [loadScore, loadHistory, loadIntelligence]);

  // ── Recalculate ────────────────────────────────────────────────────────────

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const fresh = await riskAPI.recalculate();
      setScore(fresh);
      await Promise.all([loadHistory(), loadIntelligence()]);   // refresh both
      toast(`Risk score recalculated — ${fresh.score} (${fresh.riskLevel} RISK)`, 'success');
    } catch {
      toast('Failed to recalculate risk score', 'error');
    } finally {
      setRecalculating(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loadingScore && !score) return (
    <div className="slide-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⟳</div>
        <div>Loading risk data…</div>
      </div>
    </div>
  );

  if (error && !score) return (
    <div className="slide-in">
      <div className="card" style={{ textAlign: 'center', padding: 40, color: '#DC2626' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⚠</div>
        <div style={{ fontWeight: 600 }}>Failed to load risk score</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{error}</div>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={loadScore}>Retry</button>
      </div>
    </div>
  );

  // ── Derived UI values ──────────────────────────────────────────────────────

  const currentScore = score?.score ?? 0;
  const riskLevel    = score?.riskLevel ?? 'MEDIUM';
  const riskColor    = RISK_COLORS[riskLevel] ?? '#F59E0B';

  const pieData = [
    { value: currentScore,       fill: riskColor },
    { value: 100 - currentScore, fill: '#E2E8F0' },
  ];

  const historyPoints = history?.history ?? [];
  const improvement   = history?.improvement ?? 0;
  const period        = history?.period ?? '—';

  // Trend mini-stats
  const projected = Math.min(100, currentScore + Math.round(improvement / Math.max(historyPoints.length, 1)));

  // Risk factors from live score
  const riskFactors = score ? [
    {
      label:  'Critical Gaps Open',
      value:  score.criticalGaps,
      max:    5,
      color:  '#EF4444',
      impact: 'High Impact',
    },
    {
      label:  'High Severity Gaps',
      value:  score.highGaps,
      max:    8,
      color:  '#F97316',
      impact: 'Medium Impact',
    },
    {
      label:  'Medium Severity Gaps',
      value:  score.mediumGaps,
      max:    15,
      color:  '#F59E0B',
      impact: 'Low Impact',
    },
    {
      label:  'Frameworks Below 70%',
      value:  score.frameworksBelow70,
      max:    4,
      color:  '#7C3AED',
      impact: 'Low Impact',
    },
  ] : [];

  // Risk Intelligence projection chart data
  const projectionData = intelligence?.projection ? [
    { period: 'Now', score: intelligence.projection.currentScore },
    { period: '30d', score: intelligence.projection.projected30Days },
    { period: '60d', score: intelligence.projection.projected60Days },
    { period: '90d', score: intelligence.projection.projected90Days },
  ] : [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="slide-in">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Risk Scoring</h1>
          <p>Aggregate compliance risk score based on gap analysis and framework coverage</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleRecalculate}
          disabled={recalculating}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {recalculating
            ? <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white', borderRadius: '50%', display: 'inline-block',
                animation: 'spin 0.7s linear infinite' }} />
            : <Icons.TrendingUp style={{ width: 14, height: 14 }} />
          }
          {recalculating ? 'Recalculating…' : 'Recalculate'}
        </button>
      </div>

      <div className="grid-2 section-gap">

        {/* ── Score Gauge ─────────────────────────────────────────────────── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32 }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <PieChart width={200} height={200}>
              <Pie
                data={pieData}
                cx={95} cy={95}
                startAngle={90} endAngle={-270}
                innerRadius={60} outerRadius={90}
                dataKey="value" strokeWidth={0}
              >
                {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
            </PieChart>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>
                {currentScore}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>Maturity Score</div>
            </div>
          </div>

          {/* Risk level badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 16px', background: `${riskColor}18`,
                        border: `1.5px solid ${riskColor}40`, borderRadius: 99,
                        fontSize: 13, fontWeight: 700, color: riskColor }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: riskColor }} />
            {riskLevel} RISK LEVEL
          </div>

          {/* Maturity label */}
          <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            {score?.maturityLabel}
          </div>

          <div style={{ marginTop: 8, textAlign: 'center', fontSize: 13, color: 'var(--text2)', maxWidth: 280, lineHeight: 1.5 }}>
            {score?.maturityDescription}
          </div>

          {/* Coverage mini-stat */}
          <div style={{ marginTop: 20, display: 'flex', gap: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                {score?.coveredControls ?? '—'}/{score?.totalControls ?? '—'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Controls Covered</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: riskColor }}>
                {score?.coveragePercentage ?? '—'}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Coverage</div>
            </div>
          </div>

          {/* Last calculated */}
          {score?.calculatedAt && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
              Last calculated: {new Date(score.calculatedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* ── Trend Chart ─────────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Risk Score Trend</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
            Maturity score progression over {period}
          </div>

          {loadingHist ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text3)', fontSize: 13 }}>Loading chart…</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={historyPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                  formatter={(val: number) => [`${val}`, 'Score']}
                />
                <Line
                  type="monotone" dataKey="score" stroke="#1D4ED8" strokeWidth={2.5}
                  dot={{ fill: '#1D4ED8', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Trend mini-stats */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              {
                label: 'Score Improvement',
                value: improvement >= 0 ? `+${improvement} pts` : `${improvement} pts`,
                color: improvement >= 0 ? '#16A34A' : '#EF4444',
              },
              { label: 'Period',              value: period,             color: 'var(--text)' },
              { label: 'Projected (Next Mo)', value: `${projected} pts`, color: '#1D4ED8'     },
              { label: 'Target Score',        value: '85 pts',           color: '#7C3AED'     },
            ].map(m => (
              <div key={m.label} style={{ padding: '10px 14px', background: 'var(--surface2)',
                                          borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">

        {/* ── Risk by Framework ────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Risk by Framework</div>
          {(score?.byFramework ?? []).map(fw => (
            <div key={fw.code} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${fw.color}18`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icons.Framework style={{ width: 15, height: 15, color: fw.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fw.name}</span>
                  <span
                    className="badge"
                    style={{ background: RISK_BG[fw.riskLevel] ?? '#F1F5F9',
                             color:      RISK_COLORS[fw.riskLevel] ?? '#64748B',
                             fontSize: 11 }}
                  >
                    {fw.riskLevel}
                  </span>
                </div>
                <div className="coverage-bar-track" style={{ height: 6 }}>
                  <div
                    className="coverage-bar-fill"
                    style={{ width: `${fw.riskScore}%`, background: RISK_COLORS[fw.riskLevel] ?? '#94A3B8' }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: RISK_COLORS[fw.riskLevel] ?? '#64748B',
                            width: 44, textAlign: 'right' }}>
                {fw.riskScore}%
              </div>
            </div>
          ))}
          {(score?.byFramework ?? []).length === 0 && (
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>No frameworks loaded.</div>
          )}
        </div>

        {/* ── Risk Factors ─────────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Risk Factors</div>
          {riskFactors.map(rf => (
            <div key={rf.label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{rf.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{rf.impact}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: rf.color }}>{rf.value}</div>
              </div>
              <div className="coverage-bar-track" style={{ height: 6 }}>
                <div
                  className="coverage-bar-fill"
                  style={{ width: `${Math.min((rf.value / rf.max) * 100, 100)}%`, background: rf.color }}
                />
              </div>
            </div>
          ))}

          {/* Score breakdown legend */}
          <div style={{ marginTop: 8, padding: '12px 14px', background: 'var(--surface2)',
                        borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Scoring Formula</div>
            <div style={{ color: 'var(--text3)', lineHeight: 1.7 }}>
              Base score = avg framework coverage<br />
              − 8 pts per critical gap<br />
              − 4 pts per high gap<br />
              − 2 pts per medium gap
            </div>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── RISK INTELLIGENCE SECTION ──────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      <div style={{ marginTop: 32, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Risk Analytics & Projections</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>
          Predictive risk analytics based on historical trends and current gaps
        </p>
      </div>

      {loadingIntel && !intelligence ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⟳</div>
          <div>Loading risk intelligence…</div>
        </div>
      ) : intelligence ? (
        <>
          <div className="grid-2 section-gap">

            {/* ── Risk Projection Chart ────────────────────────────────────────── */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 4 }}>
                Risk Score Projection (Next 90 Days)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
                Forecasted compliance trajectory based on current velocity
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 11, fill: '#94A3B8' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 11, fill: '#94A3B8' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                    formatter={(val: number) => [`${val}`, 'Projected Score']}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#7C3AED"
                    strokeWidth={2.5}
                    fill="url(#projGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Projection Stats */}
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>30 Days</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#7C3AED' }}>
                    {intelligence.projection.projected30Days}
                  </div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>60 Days</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#7C3AED' }}>
                    {intelligence.projection.projected60Days}
                  </div>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>90 Days</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#7C3AED' }}>
                    {intelligence.projection.projected90Days}
                  </div>
                </div>
              </div>

              {/* Trend Direction */}
              <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ 
                  fontSize: 11, fontWeight: 600, color: 'var(--text3)',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  Trend:
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 99,
                  background: intelligence.projection.trendDirection === 'improving' ? '#F0FDF4' :
                              intelligence.projection.trendDirection === 'declining' ? '#FEF2F2' : '#F1F5F9',
                  color: intelligence.projection.trendDirection === 'improving' ? '#16A34A' :
                         intelligence.projection.trendDirection === 'declining' ? '#DC2626' : '#64748B',
                  fontSize: 11, fontWeight: 700
                }}>
                  {intelligence.projection.trendDirection === 'improving' ? '↗' :
                   intelligence.projection.trendDirection === 'declining' ? '↘' : '→'}
                  {intelligence.projection.trendDirection.toUpperCase()}
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 99,
                  background: 'var(--surface2)',
                  color: 'var(--text2)',
                  fontSize: 11, fontWeight: 600
                }}>
                  Confidence: {intelligence.projection.confidence.toUpperCase()}
                </div>
              </div>
            </div>

            {/* ── Risk Alerts Panel ────────────────────────────────────────────── */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>
                Risk Alerts ({intelligence.alerts.length})
              </div>

              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {intelligence.alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                    <div style={{ fontSize: 13 }}>No active risk alerts</div>
                  </div>
                ) : (
                  intelligence.alerts.map((alert, idx) => {
                    const alertStyle = ALERT_COLORS[alert.type] || ALERT_COLORS.info;
                    return (
                      <div
                        key={idx}
                        style={{
                          marginBottom: 12,
                          padding: 12,
                          borderRadius: 8,
                          background: alertStyle.bg,
                          border: `1px solid ${alertStyle.border}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: alertStyle.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, color: 'white', fontWeight: 700, flexShrink: 0
                          }}>
                            {alert.type === 'critical' ? '!' : alert.type === 'warning' ? '⚠' : 'i'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: alertStyle.color, marginBottom: 4 }}>
                              {alert.title}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 6, lineHeight: 1.5 }}>
                              {alert.message}
                            </div>
                            <div style={{
                              fontSize: 11.5, color: 'var(--text2)',
                              padding: '6px 10px', background: 'rgba(255,255,255,0.6)',
                              borderRadius: 6, border: '1px solid rgba(0,0,0,0.05)'
                            }}>
                              💡 {alert.recommendation}
                            </div>
                          </div>
                          <div style={{
                            fontSize: 10, fontWeight: 700,
                            padding: '2px 6px', borderRadius: 4,
                            background: SEV_BG[alert.severity],
                            color: SEV_COLORS[alert.severity]
                          }}>
                            {alert.severity}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* ── Critical Gaps Section ─────────────────────────────────────────── */}
          {intelligence.criticalGaps.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-title" style={{ marginBottom: 16 }}>
                Critical & High Risk Gaps Requiring Immediate Attention ({intelligence.criticalGaps.length})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 12 }}>
                {intelligence.criticalGaps.slice(0, 6).map((gap) => (
                  <div
                    key={gap.gapId}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: 'var(--surface2)',
                      border: `1.5px solid ${SEV_COLORS[gap.severity]}40`,
                      borderLeft: `4px solid ${SEV_COLORS[gap.severity]}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div style={{
                        minWidth: 10, height: 10, borderRadius: '50%',
                        background: SEV_COLORS[gap.severity], flexShrink: 0, marginTop: 4
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                          {gap.controlCode} – {gap.controlTitle}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>
                          {gap.frameworkCode} · {gap.severity} · {gap.daysOpen} days open
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text2)', lineHeight: 1.5 }}>
                          {gap.impactDescription}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 14, fontWeight: 800,
                        color: SEV_COLORS[gap.severity],
                        minWidth: 32, textAlign: 'right'
                      }}>
                        {gap.riskScore}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {intelligence.criticalGaps.length > 6 && (
                <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
                  + {intelligence.criticalGaps.length - 6} more critical gaps
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠</div>
          <div>Risk intelligence data unavailable</div>
        </div>
      )}

    </div>
  );
}
