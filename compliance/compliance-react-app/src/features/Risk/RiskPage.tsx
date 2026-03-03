import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ToastFn } from '../../types/compliance.types';
import { FRAMEWORKS, INITIAL_DOCUMENTS, INITIAL_GAPS, RISK_HISTORY } from '../../constants/mockData';
import { SEV_COLORS, SEV_BG } from '../../constants/statusMaps';
import { coveragePct } from '../../utils/complianceUtils';
import { Icons } from '../../components/shared/Icons';

interface RiskPageProps { toast: ToastFn; }

const CURRENT_SCORE = 68;

export function RiskPage({ toast }: RiskPageProps) {
  const riskLevel = CURRENT_SCORE < 40 ? 'HIGH' : CURRENT_SCORE < 70 ? 'MEDIUM' : 'LOW';
  const riskColor = { HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#22C55E' }[riskLevel];
  const pieData = [
    { value: CURRENT_SCORE,       fill: riskColor },
    { value: 100 - CURRENT_SCORE, fill: '#E2E8F0' },
  ];

  return (
    <div className="slide-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Risk Scoring</h1>
          <p>Aggregate compliance risk score based on gap analysis and framework coverage</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => toast('Recalculating risk scores…', 'info')}>
          <Icons.TrendingUp style={{ width: 14, height: 14 }} /> Recalculate
        </button>
      </div>

      <div className="grid-2 section-gap">
        {/* Score Gauge */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32 }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <PieChart width={200} height={200}>
              <Pie data={pieData} cx={95} cy={95} startAngle={90} endAngle={-270} innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={0}>
                {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
            </PieChart>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>{CURRENT_SCORE}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>Maturity Score</div>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', background: `${riskColor}18`, border: `1.5px solid ${riskColor}40`, borderRadius: 99, fontSize: 13, fontWeight: 700, color: riskColor }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: riskColor }} />
            {riskLevel} RISK LEVEL
          </div>
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text2)', maxWidth: 260 }}>
            Your overall compliance maturity is <strong>Developing</strong>. Focus on resolving critical gaps to advance to the <strong>Established</strong> tier.
          </div>
        </div>

        {/* Trend Chart */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Risk Score Trend</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={RISK_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} domain={[20, 80]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
              <Line type="monotone" dataKey="score" stroke="#1D4ED8" strokeWidth={2.5} dot={{ fill: '#1D4ED8', r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Score Improvement',  value: '+30 pts', color: '#16A34A' },
              { label: 'Period',              value: '6 months', color: 'var(--text)' },
              { label: 'Projected (Next Mo)', value: '72 pts',  color: '#1D4ED8' },
              { label: 'Target Score',        value: '85 pts',  color: '#7C3AED' },
            ].map((m) => (
              <div key={m.label} style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Risk by Framework */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Risk by Framework</div>
          {FRAMEWORKS.map((fw) => {
            const pct      = coveragePct(fw);
            const riskScore = 100 - pct;
            const lvl       = riskScore > 60 ? 'CRITICAL' : riskScore > 30 ? 'MEDIUM' : 'LOW';
            return (
              <div key={fw.code} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${fw.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Framework style={{ width: 15, height: 15, color: fw.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{fw.name}</span>
                    <span className="badge" style={{ background: SEV_BG[lvl as keyof typeof SEV_BG], color: SEV_COLORS[lvl as keyof typeof SEV_COLORS], fontSize: 11 }}>{lvl}</span>
                  </div>
                  <div className="coverage-bar-track" style={{ height: 6 }}>
                    <div className="coverage-bar-fill" style={{ width: `${riskScore}%`, background: SEV_COLORS[lvl as keyof typeof SEV_COLORS] }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: SEV_COLORS[lvl as keyof typeof SEV_COLORS], width: 40, textAlign: 'right' }}>{riskScore}%</div>
              </div>
            );
          })}
        </div>

        {/* Risk Factors */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Risk Factors</div>
          {[
            { label: 'Critical Gaps Open',       value: INITIAL_GAPS.filter((g) => g.severity === 'CRITICAL' && g.status !== 'resolved').length, max: 5, color: '#EF4444', impact: 'High Impact' },
            { label: 'High Severity Gaps',        value: INITIAL_GAPS.filter((g) => g.severity === 'HIGH' && g.status !== 'resolved').length,     max: 8, color: '#F97316', impact: 'Medium Impact' },
            { label: 'Documents Unanalyzed',      value: INITIAL_DOCUMENTS.filter((d) => d.status !== 'analyzed').length,                         max: 5, color: '#F59E0B', impact: 'Medium Impact' },
            { label: 'Frameworks Below 70%',      value: FRAMEWORKS.filter((f) => coveragePct(f) < 70).length,                                    max: 4, color: '#7C3AED', impact: 'Low Impact' },
          ].map((rf) => (
            <div key={rf.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{rf.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{rf.impact}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: rf.color }}>{rf.value}</div>
              </div>
              <div className="coverage-bar-track" style={{ height: 6 }}>
                <div className="coverage-bar-fill" style={{ width: `${(rf.value / rf.max) * 100}%`, background: rf.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
