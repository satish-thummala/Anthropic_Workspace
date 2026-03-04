import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ToastFn } from '../../types/compliance.types';
import { INITIAL_DOCUMENTS, INITIAL_GAPS, RISK_HISTORY } from '../../constants/mockData';
import { SEV_COLORS, SEV_BG } from '../../constants/statusMaps';
import { Icons } from '../../components/shared/Icons';
import { useFrameworks } from '../../hooks/useFrameworks';

interface Props { toast: ToastFn; }

export function DashboardPage({ toast }: Props) {
  const { frameworks, loading } = useFrameworks();

  const total   = frameworks.reduce((a, f) => a + f.totalControls,   0);
  const covered = frameworks.reduce((a, f) => a + f.coveredControls, 0);
  const score   = frameworks.length
    ? Math.round(frameworks.reduce((a, f) => a + f.coveragePercentage, 0) / frameworks.length)
    : 0;

  const openGaps = INITIAL_GAPS.filter(g => g.status === 'open').length;
  const critGaps = INITIAL_GAPS.filter(g => g.severity === 'CRITICAL' && g.status !== 'resolved').length;

  const pieData = [
    { name: 'Covered', value: covered,        fill: '#3B82F6' },
    { name: 'Gaps',    value: total - covered, fill: '#E2E8F0' },
  ];

  return (
    <div className="slide-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Compliance Overview</h1>
          <p>Last updated: Feb 17, 2026 at 09:42 AM &bull; Auto-refresh every 5 min</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => toast('Running full compliance analysis…', 'info')}>
          <Icons.Zap style={{ width: 14, height: 14 }} /> Run Analysis
        </button>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Overall Coverage',   value: loading ? '…' : `${score}%`,          Icon: Icons.Shield,        bg: '#EFF6FF', ic: '#1D4ED8', delta: '+6% this month',                        up: true  },
          { label: 'Controls Covered',   value: loading ? '…' : `${covered}/${total}`, Icon: Icons.Check,         bg: '#F0FDF4', ic: '#16A34A', delta: '+12 since last scan',                   up: true  },
          { label: 'Open Gaps',          value: String(openGaps),                      Icon: Icons.AlertTriangle, bg: '#FFF7ED', ic: '#D97706', delta: `${critGaps} critical`,                   up: false },
          { label: 'Documents Ingested', value: String(INITIAL_DOCUMENTS.filter(d => d.status === 'analyzed').length),
                                                                                        Icon: Icons.Document,      bg: '#F5F3FF', ic: '#7C3AED', delta: `${INITIAL_DOCUMENTS.length} total uploaded`, up: true },
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
        {/* Framework Coverage card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="card-title">Framework Coverage</div>
              <div className="card-desc">Control coverage by regulatory standard</div>
            </div>
            <PieChart width={80} height={80}>
              <Pie data={pieData} cx={35} cy={35} innerRadius={26} outerRadius={38} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
            </PieChart>
          </div>

          {loading && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading…</div>}

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

        {/* Risk trend + Priority gaps */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Risk Score Trend</div>
          <div className="card-desc" style={{ marginBottom: 20 }}>Maturity score progression over 7 months</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>68</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>Current Score</div>
              <div style={{ fontSize: 12, color: '#16A34A', marginTop: 2 }}>↑ +30 pts (6 mo)</div>
            </div>
            <div style={{ flex: 1, height: 90 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={RISK_HISTORY}>
                  <Line type="monotone" dataKey="score" stroke="#1D4ED8" strokeWidth={2.5} dot={{ fill: '#1D4ED8', strokeWidth: 0, r: 3 }} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Top Priority Gaps</div>
            {INITIAL_GAPS.filter(g => g.severity === 'CRITICAL' && g.status !== 'resolved').slice(0, 2).map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <Icons.AlertTriangle style={{ width: 15, height: 15, color: SEV_COLORS[g.severity], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{g.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{g.framework} • {g.control}</div>
                </div>
                <span className="badge" style={{ background: SEV_BG[g.severity], color: SEV_COLORS[g.severity] }}>{g.severity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
