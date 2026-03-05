import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ToastFn, ApiRiskScore, ApiRiskHistory } from '../../types/compliance.types';
import { riskAPI } from '../../services/risk-api';
import { gapAPI } from '../../services/gap-api';
import { INITIAL_DOCUMENTS } from '../../constants/mockData';
import { SEV_COLORS, SEV_BG } from '../../constants/statusMaps';
import { Icons } from '../../components/shared/Icons';
import { useFrameworks } from '../../hooks/useFrameworks';

interface Props { toast: ToastFn; }

export function DashboardPage({ toast }: Props) {
  const { frameworks, loading: fwLoading } = useFrameworks();

  const [riskScore,    setRiskScore]    = useState<ApiRiskScore | null>(null);
  const [riskHistory,  setRiskHistory]  = useState<ApiRiskHistory | null>(null);
  const [gapStats,     setGapStats]     = useState<{ totalOpen: number; critical: number } | null>(null);
  const [loadingRisk,  setLoadingRisk]  = useState(true);

  useEffect(() => {
    // Fire all three in parallel — dashboard should feel instant
    Promise.all([
      riskAPI.getScore().then(setRiskScore).catch(() => null),
      riskAPI.getHistory().then(setRiskHistory).catch(() => null),
      gapAPI.getStats().then(s => setGapStats({ totalOpen: s.totalOpen, critical: s.critical })).catch(() => null),
    ]).finally(() => setLoadingRisk(false));
  }, []);

  // ── Derived framework values (live from API) ──────────────────────────────
  const total   = frameworks.reduce((a, f) => a + f.totalControls,   0);
  const covered = frameworks.reduce((a, f) => a + f.coveredControls, 0);
  const avgCov  = frameworks.length
    ? Math.round(frameworks.reduce((a, f) => a + f.coveragePercentage, 0) / frameworks.length)
    : 0;

  // ── Risk values (live from API) ───────────────────────────────────────────
  const currentRiskScore = riskScore?.score ?? '…';
  const improvement      = riskHistory?.improvement ?? 0;
  const period           = riskHistory?.period ?? '';
  const historyPoints    = riskHistory?.history ?? [];
  const openGaps         = gapStats?.totalOpen ?? '…';
  const critGaps         = gapStats?.critical ?? 0;

  // ── Pie data ──────────────────────────────────────────────────────────────
  const pieData = [
    { name: 'Covered', value: covered,        fill: '#3B82F6' },
    { name: 'Gaps',    value: total - covered, fill: '#E2E8F0' },
  ];

  // ── Top priority gaps (live from /gaps?status=open&severity=CRITICAL) ─────
  // We fetch separately so the dashboard doesn't need the full gap list
  const [criticalGaps, setCriticalGaps] = useState<{ id: string; controlCode: string; controlTitle: string; frameworkCode: string; severity: string }[]>([]);
  useEffect(() => {
    gapAPI.getAll({ severity: 'CRITICAL', status: 'open' })
      .then(gaps => setCriticalGaps(
        gaps.slice(0, 2).map(g => ({
          id: g.id,
          controlCode: g.controlCode,
          controlTitle: g.controlTitle,
          frameworkCode: g.frameworkCode,
          severity: g.severity,
        }))
      ))
      .catch(() => null);
  }, []);

  return (
    <div className="slide-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Compliance Overview</h1>
          <p>Live data from all frameworks, gaps and risk snapshots</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => toast('Running full compliance analysis…', 'info')}>
          <Icons.Zap style={{ width: 14, height: 14 }} /> Run Analysis
        </button>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="stats-grid">
        {[
          {
            label: 'Overall Coverage',
            value: fwLoading ? '…' : `${avgCov}%`,
            Icon: Icons.Shield, bg: '#EFF6FF', ic: '#1D4ED8',
            delta: `${covered}/${total} controls`, up: true,
          },
          {
            label: 'Controls Covered',
            value: fwLoading ? '…' : `${covered}/${total}`,
            Icon: Icons.Check, bg: '#F0FDF4', ic: '#16A34A',
            delta: `${total - covered} gaps remaining`, up: true,
          },
          {
            label: 'Open Gaps',
            value: String(openGaps),
            Icon: Icons.AlertTriangle, bg: '#FFF7ED', ic: '#D97706',
            delta: `${critGaps} critical`, up: false,
          },
          {
            label: 'Risk Score',
            value: loadingRisk ? '…' : String(currentRiskScore),
            Icon: Icons.TrendingUp, bg: '#F5F3FF', ic: '#7C3AED',
            delta: improvement >= 0 ? `↑ +${improvement} pts (${period})` : `↓ ${improvement} pts`,
            up: improvement >= 0,
          },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <s.Icon style={{ width: 18, height: 18, color: s.ic }} />
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-delta ${s.up ? 'delta-up' : 'delta-down'}`}>
              {s.up ? '↑' : '⚠'} {s.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 section-gap">

        {/* ── Framework Coverage ───────────────────────────────────────────── */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="card-title">Framework Coverage</div>
              <div className="card-desc">Control coverage by regulatory standard</div>
            </div>
            <PieChart width={80} height={80}>
              <Pie data={pieData} cx={35} cy={35} innerRadius={26} outerRadius={38}
                   startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
            </PieChart>
          </div>

          {fwLoading && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading…</div>}

          {frameworks.map(fw => (
            <div key={fw.code} className="coverage-bar-wrap">
              <div className="coverage-bar-header">
                <span className="coverage-bar-name">{fw.name}</span>
                <span className="coverage-bar-pct" style={{ color: fw.color }}>{fw.coveragePercentage}%</span>
              </div>
              <div className="coverage-bar-track">
                <div className="coverage-bar-fill" style={{ width: `${fw.coveragePercentage}%`, background: fw.color }} />
              </div>
              <div className="coverage-bar-meta">
                <span>{fw.coveredControls} of {fw.totalControls} controls</span>
                <span>{fw.totalControls - fw.coveredControls} gaps</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Risk Trend + Priority Gaps ───────────────────────────────────── */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Risk Score Trend</div>
          <div className="card-desc" style={{ marginBottom: 16 }}>
            Maturity score progression{period ? ` over ${period}` : ''}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>
                {loadingRisk ? '…' : currentRiskScore}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>Current Score</div>
              {!loadingRisk && improvement !== 0 && (
                <div style={{ fontSize: 12, color: improvement >= 0 ? '#16A34A' : '#EF4444', marginTop: 2 }}>
                  {improvement >= 0 ? '↑' : '↓'} {Math.abs(improvement)} pts ({period})
                </div>
              )}
            </div>
            <div style={{ flex: 1, height: 90 }}>
              {historyPoints.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyPoints}>
                    <Line type="monotone" dataKey="score" stroke="#1D4ED8" strokeWidth={2.5}
                          dot={{ fill: '#1D4ED8', strokeWidth: 0, r: 3 }} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center',
                              color: 'var(--text3)', fontSize: 12 }}>
                  {loadingRisk ? 'Loading…' : 'No history yet'}
                </div>
              )}
            </div>
          </div>

          {/* Top Priority Gaps — live from API */}
          <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Top Priority Gaps</div>
            {criticalGaps.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                No open critical gaps — great work!
              </div>
            ) : (
              criticalGaps.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                                         padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <Icons.AlertTriangle style={{ width: 15, height: 15,
                                                color: SEV_COLORS[g.severity as keyof typeof SEV_COLORS],
                                                flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{g.controlTitle}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {g.frameworkCode} • {g.controlCode}
                    </div>
                  </div>
                  <span className="badge"
                        style={{ background: SEV_BG[g.severity as keyof typeof SEV_BG],
                                 color: SEV_COLORS[g.severity as keyof typeof SEV_COLORS] }}>
                    {g.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
