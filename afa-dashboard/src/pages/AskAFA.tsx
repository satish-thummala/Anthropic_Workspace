import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { AI_PREDEFINED, AI_RESPONSES } from '../data/mockData'
import { ENTITY_AI_RESPONSES } from '../data/entityData'

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14 }
const darkCard = { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }

const CATEGORY_COLOR: Record<string, string> = {
  projects: '#2563eb', toll: '#10b981', budget: '#ef4444',
  risk: '#f59e0b', hr: '#8b5cf6', forecast: '#06b6d4',
  contractors: '#f97316', compliance: '#64748b',
}

interface Message { role: 'user' | 'assistant'; content: string; timestamp: string }

function formatResponse(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**'))
      return <p key={i} className="font-bold text-slate-800 mt-2 mb-0.5">{line.replace(/\*\*/g, '')}</p>
    if (line.startsWith('> '))
      return <div key={i} className="my-2 pl-3 border-l-2 border-blue-400 text-xs text-blue-700 italic">{line.slice(2)}</div>
    if (line.startsWith('|'))
      return <div key={i} className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{line}</div>
    if (line.match(/^[🔴🟡⚠️•1-9]/))
      return <p key={i} className="text-sm text-slate-700 py-0.5">{line}</p>
    if (line.trim() === '') return <div key={i} className="h-1" />
    return <p key={i} className="text-sm text-slate-700">{line.replace(/\*\*/g, '')}</p>
  })
}

export default function AskAFA() {
  const user = useSelector((s: RootState) => s.auth.user)
  const accentColor = user?.entityColor ?? '#2563eb'
  const accentBg    = user?.entityBg    ?? 'linear-gradient(135deg,#1e40af,#2563eb)'

  const entityResponses = user ? (ENTITY_AI_RESPONSES[user.entityShort] ?? AI_RESPONSES) : AI_RESPONSES

  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hello${user ? `, ${user.name.split(' ')[0]}` : ''}. I'm **AFA AI**, your intelligence assistant.\n\nI have access to live data from:\n• ${user?.scope === 'group' ? 'All group entities — Finance, Projects, Toll, HR, Security' : `${user?.entity} — ${user?.aiContext}`}\n\nAsk me anything about ${user?.scope === 'group' ? 'group-wide operations' : 'your entity\'s operations'}, or pick a suggested query.`,
    timestamp: new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
  }])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (q: string) => {
    if (!q.trim()) return
    const ts = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { role: 'user', content: q, timestamp: ts }])
    setInput('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600))
    const response = entityResponses[q] ?? AI_RESPONSES[q] ??
      `Analysing your query across ${user?.scope === 'group' ? 'all connected group systems' : user?.entity + ' data'}...\n\n**Query:** "${q}"\n\n> I've searched across ${user?.scope === 'group' ? 'Finance, HR, Projects, and Toll Operations' : `${user?.entity} — ${user?.aiContext}`}.\n\nFor a precise response, try one of the suggested queries which map to live data. Or contact your data analyst team for a custom report.`
    setMessages(prev => [...prev, {
      role: 'assistant', content: response,
      timestamp: new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
    }])
    setLoading(false)
  }

  const avatarInitials = user?.avatar ?? 'U'

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 104px)' }}>
      {/* Header */}
      <div className="rounded-2xl p-5 shrink-0" style={darkCard}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: accentColor }} />
              <span className="text-xs font-medium" style={{ color: accentColor }}>
                AI Engine · {user?.scope === 'group' ? '8 live data sources' : user?.entity}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">Ask AFA AI</h2>
            <p className="text-sm text-slate-400">
              {user?.scope === 'group'
                ? 'Group-wide intelligence across all entities and systems'
                : `Scoped to ${user?.entity} — ${user?.aiContext}`}
            </p>
          </div>
          <div className="px-4 py-2 rounded-xl" style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}>
            <div className="text-xs" style={{ color: accentColor }}>Powered by</div>
            <div className="text-sm font-bold text-white">AFA Intelligence Engine v2.1</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Chat window */}
        <div className="flex-1 flex flex-col min-h-0" style={card}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: msg.role === 'user' ? accentBg : 'linear-gradient(135deg,#0f172a,#1e293b)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {msg.role === 'user' ? avatarInitials : 'AI'}
                </div>
                <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="rounded-2xl px-4 py-3"
                    style={msg.role === 'user'
                      ? { background: accentBg, color: '#fff', borderBottomRightRadius: 4 }
                      : { background: '#f8fafc', border: '1px solid #e2e8f0', borderBottomLeftRadius: 4 }}>
                    {msg.role === 'user'
                      ? <p className="text-sm text-white">{msg.content}</p>
                      : <div className="space-y-0.5">{formatResponse(msg.content)}</div>}
                  </div>
                  <span className="text-xs text-slate-400 px-1">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', border: '1px solid rgba(255,255,255,0.1)' }}>AI</div>
                <div className="px-4 py-3 rounded-2xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderBottomLeftRadius: 4 }}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0,0.2,0.4].map(d => (
                        <div key={d} className="w-2 h-2 rounded-full"
                          style={{ background: accentColor, animation: 'dotPulse 1.2s ease-in-out infinite', animationDelay: `${d}s` }} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">
                      Analysing {user?.scope === 'group' ? 'all group data' : user?.entity + ' data'}…
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t shrink-0" style={{ borderColor: '#e2e8f0' }}>
            <form onSubmit={e => { e.preventDefault(); sendMessage(input) }} className="flex gap-3">
              <input value={input} onChange={e => setInput(e.target.value)}
                placeholder={`Ask about ${user?.scope === 'group' ? 'group operations, revenue, projects, HR...' : user?.entity + ' performance, projects, risks...'}`}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                onFocus={e => (e.target.style.borderColor = accentColor)}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                disabled={loading} />
              <button type="submit" disabled={loading || !input.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shrink-0"
                style={{ background: loading || !input.trim() ? `${accentColor}66` : accentBg, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Suggested queries sidebar */}
        <div className="w-56 shrink-0 hidden xl:block">
          <div className="p-4 h-full overflow-y-auto" style={card}>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Suggested Queries</h4>
            <div className="space-y-2">
              {AI_PREDEFINED.map(q => (
                <button key={q.q} onClick={() => sendMessage(q.q)} disabled={loading}
                  className="w-full text-left px-3 py-3 rounded-xl text-xs font-medium transition-all hover:shadow-sm"
                  style={{ background: `${CATEGORY_COLOR[q.category]}10`, border: `1px solid ${CATEGORY_COLOR[q.category]}25`, color: '#334155' }}>
                  <div className="w-1.5 h-1.5 rounded-full mb-1.5 inline-block mr-1.5"
                    style={{ background: CATEGORY_COLOR[q.category] }} />
                  {q.q}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t" style={{ borderColor: '#f1f5f9' }}>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Scope</h4>
              <div className="p-2.5 rounded-xl text-xs" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}25` }}>
                <div className="font-semibold mb-0.5" style={{ color: accentColor }}>{user?.entityShort}</div>
                <div className="text-slate-500 leading-relaxed">{user?.aiContext}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes dotPulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  )
}
