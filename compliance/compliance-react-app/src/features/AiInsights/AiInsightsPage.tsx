import React, { useState, useEffect, useRef } from 'react';
import type { ToastFn } from '../../types/compliance.types';
import { aiInsightsAPI, type AiResponse, type AiStatusResponse } from '../../services/ai-insights-api';
import { gapAPI } from '../../services/gap-api';
import type { ApiGap } from '../../types/compliance.types';

interface Props { toast: ToastFn; }

type Tab = 'rank' | 'explain' | 'chat' | 'brief';
const TABS: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: 'rank',    label: 'Gap Prioritiser',  icon: '🎯', desc: 'AI-ranked remediation order' },
  { id: 'explain', label: 'Gap Explainer',    icon: '📖', desc: 'Plain-English gap breakdown' },
  { id: 'chat',    label: 'Compliance Q&A',   icon: '💬', desc: 'Ask anything about your posture' },
  { id: 'brief',   label: 'Executive Brief',  icon: '📊', desc: 'Board-ready health summary' },
];

const SUGGESTED = [
  'What is our current risk score?',
  'Which frameworks have the lowest coverage?',
  'How many critical gaps are open?',
  'What evidence do we need for ISO27001?',
  'Have we improved over the last few months?',
];

function EngineBadge({ status }: { status: AiStatusResponse | null }) {
  if (!status) return null;
  const isGroq = status.activeEngine === 'groq';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 99,
      background: isGroq ? '#0F172A' : '#F3F4F6',
      border: `1px solid ${isGroq ? '#334155' : '#E5E7EB'}`,
      fontSize: 11, fontWeight: 700,
      color: isGroq ? '#93C5FD' : '#6B7280',
    }}>
      <span style={{ fontSize: 13 }}>{isGroq ? '⚡' : '🔧'}</span>
      {isGroq ? `Groq · ${status.model}` : 'Local Intelligence Engine'}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: 'white', borderRadius: '50%', display: 'inline-block',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

function AiOutput({ text, loading, durationMs, engine }: {
  text: string; loading: boolean; durationMs?: number; engine?: string;
}) {
  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={{
          width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#7C3AED',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px',
        }} />
        <div style={{ color: 'var(--text2)', fontSize: 13 }}>
          {engine === 'groq' ? 'Asking Groq AI…' : 'Analysing compliance data…'}
        </div>
      </div>
    );
  }
  if (!text) return null;

  const lines = text.split('\n');
  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      {durationMs !== undefined && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
          padding: '5px 12px', background: 'var(--surface2)',
          borderRadius: 8, fontSize: 11, color: 'var(--text3)',
        }}>
          <span>{engine === 'groq' ? '⚡ Groq AI' : '🔧 Local Engine'}</span>
          <span>·</span>
          <span>{(durationMs / 1000).toFixed(1)}s</span>
        </div>
      )}
      <div style={{
        background: 'var(--surface2)', borderRadius: 12,
        padding: '20px 24px', lineHeight: 1.7, fontSize: 13.5,
      }}>
        {lines.map((line, i) => {
          if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
          if (/^[═─]+$/.test(line.trim()))
            return <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />;
          if (/^[A-Z][A-Z\s]{4,}$/.test(line.trim()))
            return <div key={i} style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', letterSpacing: '0.08em', marginTop: 14, marginBottom: 4 }}>{line}</div>;
          if (/^\d+\.\s/.test(line.trim()))
            return (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 700, color: '#7C3AED', minWidth: 20, fontSize: 13 }}>{line.match(/^\d+/)![0]}.</span>
                <span style={{ color: 'var(--text)', flex: 1 }}>{line.replace(/^\d+\.\s/, '')}</span>
              </div>
            );
          if (/^[•·\-]\s/.test(line.trim()))
            return (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
                <span style={{ color: '#7C3AED', marginTop: 2 }}>•</span>
                <span style={{ color: 'var(--text)', flex: 1 }}>{line.replace(/^[•·\-]\s/, '')}</span>
              </div>
            );
          if (/^[\w\s]+:\s/.test(line) && line.indexOf(':') < 22) {
            const ci = line.indexOf(':');
            return (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text2)', minWidth: 110, fontSize: 12.5 }}>{line.substring(0, ci)}</span>
                <span style={{ color: 'var(--text)' }}>{line.substring(ci + 1).trim()}</span>
              </div>
            );
          }
          return <p key={i} style={{ margin: '0 0 5px', color: 'var(--text)' }}>{line}</p>;
        })}
      </div>
    </div>
  );
}

export function AiInsightsPage({ toast }: Props) {
  const [tab,         setTab]         = useState<Tab>('rank');
  const [status,      setStatus]      = useState<AiStatusResponse | null>(null);
  const [result,      setResult]      = useState<AiResponse | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [gaps,        setGaps]        = useState<ApiGap[]>([]);
  const [selectedGap, setSelectedGap] = useState('');
  const [question,    setQuestion]    = useState('');
  const [messages,    setMessages]    = useState<{ role: 'user' | 'ai'; text: string; ms?: number }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiInsightsAPI.getStatus().then(setStatus).catch(() => null);
    gapAPI.getAll({ status: 'open' })
      .then(all => { setGaps(all); if (all.length > 0) setSelectedGap(all[0].id); })
      .catch(() => null);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { setResult(null); }, [tab]);

  async function run<T>(fn: () => Promise<T>, onSuccess: (r: T) => void) {
    setLoading(true); setResult(null);
    try { onSuccess(await fn()); }
    catch { toast('AI request failed', 'error'); }
    finally { setLoading(false); }
  }

  async function handleChat(q: string) {
    if (!q.trim()) return;
    const msg = q.trim();
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const r = await aiInsightsAPI.chat(msg);
      setMessages(prev => [...prev, { role: 'ai', text: r.text, ms: r.durationMs }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I could not process that request.' }]);
    } finally { setLoading(false); }
  }

  const emptyState = (icon: string, title: string, sub: string) => (
    <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text3)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>{title}</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>
    </div>
  );

  return (
    <div className="slide-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>✨</span> AI Insights
          </h1>
          <p>AI-powered compliance analysis — gap prioritisation, explainers, Q&amp;A, and executive briefs</p>
        </div>
        <EngineBadge status={status} />
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
            border: tab === t.id ? '2px solid #7C3AED' : '1.5px solid var(--border)',
            background: tab === t.id ? '#F5F3FF' : 'var(--surface)',
            color: tab === t.id ? '#7C3AED' : 'var(--text2)',
            fontWeight: tab === t.id ? 700 : 500, fontSize: 13, transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div>{t.label}</div>
              <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 400 }}>{t.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Gap Prioritiser ───────────────────────────────────────────────── */}
      {tab === 'rank' && (
        <div className="card slide-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div className="card-title">🎯 Gap Priority Ranker</div>
              <div className="card-desc">AI analyses all open gaps and ranks them by remediation urgency with specific actions</div>
            </div>
            <button className="btn btn-primary" onClick={() => run(() => aiInsightsAPI.rankGaps(10), setResult)}
              disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              {loading ? <><Spinner /> Analysing…</> : <><span>✨</span> Rank My Gaps</>}
            </button>
          </div>
          <AiOutput text={result?.text ?? ''} loading={loading} durationMs={result?.durationMs} engine={result?.engine} />
          {!result && !loading && emptyState('🎯', 'Click "Rank My Gaps" to get started', 'AI will prioritise your open gaps and tell you what to fix first')}
        </div>
      )}

      {/* ── Gap Explainer ─────────────────────────────────────────────────── */}
      {tab === 'explain' && (
        <div className="card slide-in">
          <div className="card-title" style={{ marginBottom: 4 }}>📖 Policy Gap Explainer</div>
          <div className="card-desc" style={{ marginBottom: 16 }}>Select a gap and get a plain-English explanation with a step-by-step remediation plan</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <select value={selectedGap} onChange={e => { setSelectedGap(e.target.value); setResult(null); }} style={{
              flex: 1, minWidth: 280, padding: '9px 12px',
              border: '1.5px solid var(--border)', borderRadius: 8,
              background: 'var(--surface2)', fontSize: 13, color: 'var(--text)', cursor: 'pointer',
            }}>
              {gaps.length === 0
                ? <option value="">No open gaps found</option>
                : gaps.map(g => (
                    <option key={g.id} value={g.id}>
                      [{g.severity}] {g.frameworkCode} · {g.controlCode} — {g.controlTitle.substring(0, 55)}
                    </option>
                  ))}
            </select>
            <button className="btn btn-primary"
              onClick={() => run(() => aiInsightsAPI.explainGap(selectedGap), setResult)}
              disabled={loading || !selectedGap}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {loading ? <><Spinner /> Explaining…</> : <><span>📖</span> Explain This Gap</>}
            </button>
          </div>
          <AiOutput text={result?.text ?? ''} loading={loading} durationMs={result?.durationMs} engine={result?.engine} />
          {!result && !loading && emptyState('📖', 'Select a gap above and click "Explain"', `${gaps.length} open gaps available`)}
        </div>
      )}

      {/* ── Compliance Q&A ────────────────────────────────────────────────── */}
      {tab === 'chat' && (
        <div className="card slide-in" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title" style={{ marginBottom: 4 }}>💬 Compliance Q&amp;A</div>
          <div className="card-desc" style={{ marginBottom: 16 }}>Ask anything about your compliance posture in plain English</div>

          {messages.length === 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', marginBottom: 8 }}>
                SUGGESTED QUESTIONS
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => handleChat(q)} style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--border)', background: 'var(--surface2)',
                    fontSize: 12, color: 'var(--text2)', cursor: 'pointer', transition: 'all 0.15s',
                  }}>{q}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ minHeight: 280, maxHeight: 420, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                  background: m.role === 'user' ? '#7C3AED' : 'var(--surface2)',
                  color: m.role === 'user' ? 'white' : 'var(--text)',
                  borderBottomRightRadius: m.role === 'user' ? 3 : 12,
                  borderBottomLeftRadius: m.role === 'ai' ? 3 : 12,
                }}>
                  {m.text.split('\n').map((l, j) => <div key={j}>{l || <span>&nbsp;</span>}</div>)}
                  {m.ms && <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>{(m.ms / 1000).toFixed(1)}s</div>}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--surface2)', display: 'flex', gap: 4 }}>
                  {[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8', animation: `pulse 1.2s ease-in-out ${d*0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input value={question} onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat(question)}
              placeholder="Ask about your compliance status, gaps, frameworks…"
              disabled={loading}
              style={{
                flex: 1, padding: '10px 14px', border: '1.5px solid var(--border)',
                borderRadius: 8, fontSize: 13, color: 'var(--text)',
                background: 'var(--surface2)', outline: 'none',
              }}
            />
            <button onClick={() => handleChat(question)} disabled={loading || !question.trim()} style={{
              padding: '10px 18px', borderRadius: 8, border: 'none',
              background: question.trim() ? '#7C3AED' : 'var(--border)',
              color: question.trim() ? 'white' : 'var(--text3)',
              fontSize: 13, fontWeight: 600,
              cursor: question.trim() ? 'pointer' : 'default', transition: 'all 0.15s',
            }}>Send</button>
          </div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{
              marginTop: 8, fontSize: 11, color: 'var(--text3)',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}>Clear conversation</button>
          )}
        </div>
      )}

      {/* ── Executive Brief ───────────────────────────────────────────────── */}
      {tab === 'brief' && (
        <div className="card slide-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div className="card-title">📊 Executive Health Brief</div>
              <div className="card-desc">Board-ready compliance posture summary — copy or share with leadership</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {result && (
                <button className="btn btn-secondary"
                  onClick={() => { navigator.clipboard.writeText(result.text); toast('Copied to clipboard', 'success'); }}
                  style={{ fontSize: 12 }}>📋 Copy</button>
              )}
              <button className="btn btn-primary"
                onClick={() => run(() => aiInsightsAPI.executiveBrief(), setResult)}
                disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                {loading ? <><Spinner /> Generating…</> : <><span>📊</span> Generate Brief</>}
              </button>
            </div>
          </div>
          <AiOutput text={result?.text ?? ''} loading={loading} durationMs={result?.durationMs} engine={result?.engine} />
          {!result && !loading && emptyState('📊', 'Click "Generate Brief" to create an executive summary', 'Synthesises live data from all frameworks, gaps, and risk scores')}
        </div>
      )}
    </div>
  );
}
