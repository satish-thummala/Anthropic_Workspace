import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie,
  AreaChart, Area,
} from 'recharts';
import type { ToastFn, ApiGap, ApiGapStats, ApiRiskScore, ApiFrameworkSummary, ApiRiskHistory } from '../../types/compliance.types';
import { aiInsightsAPI, type AiResponse, type AiStatusResponse } from '../../services/ai-insights-api';
import { gapAPI } from '../../services/gap-api';
import { riskAPI } from '../../services/risk-api';
import { frameworkAPI } from '../../services/framework-api';

interface Props { toast: ToastFn; }
type Tab = 'overview' | 'rank' | 'explain' | 'chat' | 'brief';

const TABS: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: 'overview', label: 'AI Overview',    icon: '📈', desc: 'Live compliance dashboard'       },
  { id: 'rank',     label: 'Gap Prioritiser',icon: '🎯', desc: 'AI-ranked remediation order'     },
  { id: 'explain',  label: 'Gap Explainer',  icon: '📖', desc: 'Plain-English gap breakdown'     },
  { id: 'chat',     label: 'Compliance Q&A', icon: '💬', desc: 'Ask anything about your posture' },
  { id: 'brief',    label: 'Executive Brief',icon: '📊', desc: 'Board-ready health summary'      },
];
const SUGGESTED = [
  'What is our current risk score?',
  'Which frameworks have the lowest coverage?',
  'How many critical gaps are open?',
  'What evidence do we need for ISO27001?',
  'Have we improved over the last few months?',
];
const SEV_COL: Record<string,string> = { CRITICAL:'#EF4444', HIGH:'#F97316', MEDIUM:'#EAB308', LOW:'#22C55E' };
const MAT_STAGES = ['Initial','Developing','Establishing','Established','Optimizing'];
const MAT_COL    = ['#EF4444','#F97316','#EAB308','#3B82F6','#22C55E'];

const riskCol = (n: number) => n>=80?'#22C55E': n>=60?'#3B82F6': n>=40?'#EAB308':'#EF4444';
const sevW    = (s: string) => ({CRITICAL:100,HIGH:70,MEDIUM:40,LOW:15} as Record<string,number>)[s]??0;

/* ── shared tiny components ─────────────────────────────────────────────── */

function EngineBadge({ status }: { status: AiStatusResponse|null }) {
  if (!status) return null;
  const g = status.activeEngine==='groq';
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px',
      borderRadius:99, background:g?'#0F172A':'#F3F4F6',
      border:`1px solid ${g?'#334155':'#E5E7EB'}`, fontSize:11, fontWeight:700,
      color:g?'#93C5FD':'#6B7280' }}>
      <span style={{fontSize:13}}>{g?'⚡':'🔧'}</span>
      {g ? `Groq · ${status.model}` : 'Local Intelligence Engine'}
    </div>
  );
}

function Spinner() {
  return <span style={{ width:12, height:12, flexShrink:0,
    border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'white',
    borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />;
}

function Ring({ score, size=96 }: { score:number; size?:number }) {
  const r=size/2-9, c=2*Math.PI*r, col=riskCol(score);
  return (
    <svg width={size} height={size} style={{flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={9}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={9}
        strokeDasharray={`${(score/100)*c} ${c}`} strokeLinecap="round" strokeDashoffset={c/4}
        style={{transition:'stroke-dasharray 1.2s ease'}}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill={col}
        fontSize={size*0.22} fontWeight={800} fontFamily="inherit">{score}</text>
    </svg>
  );
}

function MBar({ label, val, max, col }: { label:string; val:number; max:number; col:string }) {
  const p = max===0?0:Math.min(100,Math.round((val/max)*100));
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
        <span style={{fontSize:11.5, color:'var(--text2)', fontWeight:500}}>{label}</span>
        <span style={{fontSize:11.5, fontWeight:700, color:col}}>{val}</span>
      </div>
      <div style={{height:5, background:'#F1F5F9', borderRadius:99, overflow:'hidden'}}>
        <div style={{width:`${p}%`, height:'100%', background:col, borderRadius:99,
          transition:'width 0.9s ease'}}/>
      </div>
    </div>
  );
}

function RCard({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:12, padding:'16px 20px', boxShadow:'0 1px 4px rgba(15,23,42,0.05)' }}>
      <div style={{ fontSize:10, fontWeight:800, color:'var(--text3)',
        letterSpacing:'0.09em', textTransform:'uppercase' as const, marginBottom:14 }}>{title}</div>
      {children}
    </div>
  );
}

function CTip({ active, payload, label }: any) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8,
      padding:'7px 12px', fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
      {label && <div style={{fontWeight:700,color:'var(--text)',marginBottom:3}}>{label}</div>}
      {payload.map((p:any,i:number)=>(
        <div key={i} style={{color:p.color??'var(--text2)'}}>{p.name}: <b>{p.value}</b></div>
      ))}
    </div>
  );
}

function AiText({ text, loading, engine }: { text:string; loading:boolean; engine?:string }) {
  if (loading) return (
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',gap:12,padding:'40px 0'}}>
      <div style={{width:38,height:38,border:'3px solid #E2E8F0',borderTopColor:'#7C3AED',
        borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
      <div style={{fontSize:13,color:'var(--text2)'}}>
        {engine==='groq'?'⚡ Asking Groq AI…':'🔧 Analysing compliance data…'}
      </div>
    </div>
  );
  if (!text) return null;
  return (
    <div style={{flex:1,overflowY:'auto',animation:'slideIn 0.3s ease'}}>
      {text.split('\n').map((line,i)=>{
        if (!line.trim()) return <div key={i} style={{height:5}}/>;
        if (/^[═─]+$/.test(line.trim()))
          return <hr key={i} style={{border:'none',borderTop:'1px solid var(--border)',margin:'8px 0'}}/>;
        if (/^[A-Z][A-Z\s]{3,}$/.test(line.trim()))
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,margin:'14px 0 5px'}}>
              <div style={{height:1,flex:1,background:'linear-gradient(90deg,#7C3AED30,transparent)'}}/>
              <span style={{fontSize:10,fontWeight:800,color:'#7C3AED',letterSpacing:'0.09em'}}>{line}</span>
              <div style={{height:1,flex:1,background:'linear-gradient(270deg,#7C3AED30,transparent)'}}/>
            </div>
          );
        if (/^\d+\.\s/.test(line.trim()))
          return (
            <div key={i} style={{display:'flex',gap:9,marginBottom:7,alignItems:'flex-start'}}>
              <span style={{minWidth:20,height:20,background:'#F5F3FF',borderRadius:6,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:11,fontWeight:800,color:'#7C3AED',flexShrink:0}}>
                {line.match(/^\d+/)![0]}
              </span>
              <span style={{color:'var(--text)',fontSize:13,lineHeight:1.6,flex:1}}>
                {line.replace(/^\d+\.\s/,'')}
              </span>
            </div>
          );
        if (/^[•·\-]\s/.test(line.trim()))
          return (
            <div key={i} style={{display:'flex',gap:8,marginBottom:5,alignItems:'flex-start'}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:'#7C3AED',marginTop:6,flexShrink:0}}/>
              <span style={{color:'var(--text)',fontSize:13,lineHeight:1.6,flex:1}}>
                {line.replace(/^[•·\-]\s/,'')}
              </span>
            </div>
          );
        if (/^[\w\s]+:\s/.test(line)&&line.indexOf(':')<22) {
          const ci=line.indexOf(':');
          return (
            <div key={i} style={{display:'flex',gap:8,marginBottom:4}}>
              <span style={{fontWeight:700,color:'var(--text2)',minWidth:110,fontSize:11,flexShrink:0}}>
                {line.substring(0,ci).toUpperCase()}
              </span>
              <span style={{color:'var(--text)',fontSize:13}}>{line.substring(ci+1).trim()}</span>
            </div>
          );
        }
        return <p key={i} style={{margin:'0 0 5px',color:'var(--text)',fontSize:13,lineHeight:1.65}}>{line}</p>;
      })}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────────── */

export function AiInsightsPage({ toast }: Props) {
  const [tab,        setTab]        = useState<Tab>('overview');
  const [status,     setStatus]     = useState<AiStatusResponse|null>(null);
  const [result,     setResult]     = useState<AiResponse|null>(null);
  const [loading,    setLoading]    = useState(false);
  const [openGaps,   setOpenGaps]   = useState<ApiGap[]>([]);
  const [allGaps,    setAllGaps]    = useState<ApiGap[]>([]);
  const [gapStats,   setGapStats]   = useState<ApiGapStats|null>(null);
  const [riskScore,  setRiskScore]  = useState<ApiRiskScore|null>(null);
  const [riskHist,   setRiskHist]   = useState<ApiRiskHistory|null>(null);
  const [frameworks, setFrameworks] = useState<ApiFrameworkSummary[]>([]);
  const [selGap,     setSelGap]     = useState('');
  const [question,   setQuestion]   = useState('');
  const [messages,   setMessages]   = useState<{role:'user'|'ai';text:string;ms?:number}[]>([]);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    aiInsightsAPI.getStatus().then(setStatus).catch(()=>null);
    gapAPI.getAll({status:'open'}).then(g=>{setOpenGaps(g);if(g.length)setSelGap(g[0].id);}).catch(()=>null);
    gapAPI.getAll().then(setAllGaps).catch(()=>null);
    gapAPI.getStats().then(setGapStats).catch(()=>null);
    riskAPI.getScore().then(setRiskScore).catch(()=>null);
    riskAPI.getHistory().then(setRiskHist).catch(()=>null);
    frameworkAPI.getAll().then(setFrameworks).catch(()=>null);
  },[]);
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:'smooth'});},[messages]);
  useEffect(()=>{setResult(null);},[tab]);

  async function runAI(fn:()=>Promise<AiResponse>) {
    setLoading(true); setResult(null);
    try { setResult(await fn()); }
    catch { toast('AI request failed','error'); }
    finally { setLoading(false); }
  }
  async function handleChat(q:string) {
    if (!q.trim()) return;
    const msg=q.trim(); setQuestion('');
    setMessages(p=>[...p,{role:'user',text:msg}]);
    setLoading(true);
    try {
      const r=await aiInsightsAPI.chat(msg);
      setMessages(p=>[...p,{role:'ai',text:r.text,ms:r.durationMs}]);
    } catch {
      setMessages(p=>[...p,{role:'ai',text:'Sorry, I could not process that request.'}]);
    } finally { setLoading(false); }
  }

  /* derived chart data */
  const sevBars    = ['CRITICAL','HIGH','MEDIUM','LOW'].map(s=>({
    name:s, value:allGaps.filter(g=>g.severity===s).length, color:SEV_COL[s],
  }));
  const openSevBars = ['CRITICAL','HIGH','MEDIUM','LOW'].map(s=>({
    name:s, value:openGaps.filter(g=>g.severity===s).length, color:SEV_COL[s],
  }));
  const statusPie  = gapStats ? [
    {name:'Open',        value:gapStats.totalOpen,         color:'#EF4444'},
    {name:'In Progress', value:gapStats.totalInProgress,   color:'#F97316'},
    {name:'Resolved',    value:gapStats.totalResolved,     color:'#22C55E'},
    {name:'Accepted',    value:gapStats.totalAcceptedRisk, color:'#94A3B8'},
  ].filter(d=>d.value>0) : [];
  const fwCovBars  = frameworks.slice(0,7).map(f=>({name:f.code,pct:f.coveragePercentage,color:f.color||'#7C3AED'}));
  const radarData  = frameworks.slice(0,6).map(f=>({fw:f.code,coverage:f.coveragePercentage}));
  const trendData  = (riskHist?.history??[]).map(h=>({month:h.month,score:h.score}));
  const fwGapBars  = (gapStats?.byFramework??[]).slice(0,6).map(fw=>({name:fw.frameworkCode,open:fw.open,total:fw.total}));
  const prioBars   = openGaps.slice(0,8).map(g=>({name:g.controlCode,score:sevW(g.severity),color:SEV_COL[g.severity]}));
  const selGapObj  = openGaps.find(g=>g.id===selGap);
  const matIdx     = MAT_STAGES.indexOf(riskScore?.maturityLabel??'Initial');
  const totalOpen  = gapStats?.totalOpen??0;
  const avgCov     = fwCovBars.length ? Math.round(fwCovBars.reduce((a,f)=>a+f.pct,0)/fwCovBars.length) : 0;

  const SPLIT: React.CSSProperties = {display:'grid',gridTemplateColumns:'1fr 360px',gap:20,alignItems:'start'};
  const RC:    React.CSSProperties = {display:'flex',flexDirection:'column',gap:16};

  function Empty({icon,title,sub}:{icon:string;title:string;sub:string}) {
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
        justifyContent:'center',gap:10,opacity:0.45,padding:'36px 0'}}>
        <div style={{fontSize:44}}>{icon}</div>
        <div style={{fontSize:14,fontWeight:600,color:'var(--text2)'}}>{title}</div>
        <div style={{fontSize:12,color:'var(--text3)'}}>{sub}</div>
      </div>
    );
  }
  function Meta({r}:{r:AiResponse}) {
    return (
      <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid var(--border)',
        display:'flex',gap:7,fontSize:11,color:'var(--text3)'}}>
        <span>{r.engine==='groq'?'⚡ Groq AI':'🔧 Local Engine'}</span>
        <span>·</span><span>{(r.durationMs/1000).toFixed(1)}s</span>
      </div>
    );
  }

  return (
    <div className="slide-in">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{display:'inline-flex',width:34,height:34,borderRadius:9,
              background:'linear-gradient(135deg,#7C3AED,#4F46E5)',
              alignItems:'center',justifyContent:'center',fontSize:17}}>✨</span>
            AI Insights
          </h1>
          <p>AI-powered compliance intelligence — live overview, gap prioritisation, explainers, Q&amp;A &amp; executive briefs</p>
        </div>
        <EngineBadge status={status}/>
      </div>

      {/* Sub-nav */}
      <div style={{display:'flex',gap:6,marginBottom:22}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,display:'flex',alignItems:'center',gap:8,padding:'10px 14px',
              borderRadius:10,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
              border:tab===t.id?'2px solid #7C3AED':'1.5px solid var(--border)',
              background:tab===t.id?'linear-gradient(135deg,#F5F3FF,#EDE9FE)':'var(--surface)',
              boxShadow:tab===t.id?'0 2px 8px rgba(124,58,237,0.14)':'none'}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <div style={{textAlign:'left',flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:tab===t.id?'#7C3AED':'var(--text)'}}>{t.label}</div>
              <div style={{fontSize:10,color:tab===t.id?'#A78BFA':'var(--text3)'}}>{t.desc}</div>
            </div>
            {tab===t.id&&<div style={{width:6,height:6,borderRadius:'50%',background:'#7C3AED'}}/>}
          </button>
        ))}
      </div>

      {/* ══════════ TAB 0 — AI OVERVIEW (new, charts-only) ══════════ */}
      {tab==='overview'&&(
        <div className="slide-in">

          {/* Stat tiles row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:16}}>
            {[
              { label:'Risk Score',   value:riskScore?`${riskScore.score}`:'—',   sub:riskScore?.riskLevel??'Calculating…',  col:riskCol(riskScore?.score??0) },
              { label:'Open Gaps',    value:`${totalOpen}`,                        sub:`${gapStats?.critical??0} critical`,   col:'#EF4444' },
              { label:'Avg Coverage', value:fwCovBars.length?`${avgCov}%`:'—',     sub:'across all frameworks',               col:'#3B82F6' },
              { label:'Maturity',     value:riskScore?.maturityLabel??'—',         sub:`Stage ${matIdx+1} of 5`,              col:MAT_COL[matIdx]??'#64748B' },
            ].map((k,i)=>(
              <div key={i} className="stat-card">
                <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',letterSpacing:'0.07em',
                  textTransform:'uppercase' as const,marginBottom:8}}>{k.label}</div>
                <div style={{fontSize:26,fontWeight:800,color:k.col,lineHeight:1,marginBottom:4}}>{k.value}</div>
                <div style={{fontSize:12,color:'var(--text3)'}}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Row 2 — trend + severity side by side */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <RCard title="Risk Score Trend">
              {trendData.length<2
                ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',
                    height:180,color:'var(--text3)',fontSize:13}}>Not enough history yet</div>
                :<ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#7C3AED" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                    <XAxis dataKey="month" tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CTip/>}/>
                    <Area type="monotone" dataKey="score" name="Score"
                      stroke="#7C3AED" strokeWidth={2.5} fill="url(#tg)"/>
                  </AreaChart>
                </ResponsiveContainer>
              }
            </RCard>

            <RCard title="All Gaps by Severity">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sevBars} barCategoryGap="32%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                  <XAxis dataKey="name" tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip content={<CTip/>}/>
                  <Bar dataKey="value" name="Gaps" radius={[5,5,0,0]}>
                    {sevBars.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </RCard>
          </div>

          {/* Row 3 — framework coverage bar + status donut + radar */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 220px 1fr',gap:16,marginBottom:16}}>

            <RCard title="Framework Coverage %">
              {fwCovBars.length===0
                ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:180,color:'var(--text3)',fontSize:13}}>Loading…</div>
                :<ResponsiveContainer width="100%" height={180}>
                  <BarChart data={fwCovBars} barCategoryGap="28%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CTip/>} formatter={(v:any)=>[`${v}%`,'Coverage']}/>
                    <Bar dataKey="pct" name="Coverage %" radius={[5,5,0,0]}>
                      {fwCovBars.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              }
            </RCard>

            <RCard title="Gap Status">
              {statusPie.length===0
                ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:180,color:'var(--text3)',fontSize:12}}>No data</div>
                :<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
                  <PieChart width={140} height={140}>
                    <Pie data={statusPie} cx={70} cy={70} innerRadius={36} outerRadius={62}
                      dataKey="value" stroke="white" strokeWidth={2}>
                      {statusPie.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    </Pie>
                  </PieChart>
                  <div style={{width:'100%'}}>
                    {statusPie.map((d,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5,fontSize:12}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:d.color,flexShrink:0}}/>
                        <span style={{color:'var(--text2)',flex:1}}>{d.name}</span>
                        <span style={{fontWeight:700,color:'var(--text)'}}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              }
            </RCard>

            <RCard title="Framework Coverage Radar">
              {radarData.length===0
                ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:180,color:'var(--text3)',fontSize:13}}>Loading…</div>
                :<ResponsiveContainer width="100%" height={210}>
                  <RadarChart data={radarData} cx="50%" cy="50%">
                    <PolarGrid stroke="#E2E8F0"/>
                    <PolarAngleAxis dataKey="fw" tick={{fontSize:11,fill:'#64748B'}}/>
                    <Radar name="Coverage %" dataKey="coverage"
                      stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.15} strokeWidth={2}/>
                    <Tooltip content={<CTip/>}/>
                  </RadarChart>
                </ResponsiveContainer>
              }
            </RCard>
          </div>

          {/* Row 4 — gaps per framework + maturity journey */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

            <RCard title="Open vs Total Gaps by Framework">
              {fwGapBars.length===0
                ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:180,color:'var(--text3)',fontSize:13}}>No data</div>
                :<ResponsiveContainer width="100%" height={180}>
                  <BarChart data={fwGapBars} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:11,fill:'#94A3B8'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={<CTip/>}/>
                    <Bar dataKey="open"  name="Open"  fill="#EF4444" radius={[4,4,0,0]}/>
                    <Bar dataKey="total" name="Total" fill="#BFDBFE" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              }
            </RCard>

            <RCard title="Maturity Journey">
              <div style={{display:'flex',alignItems:'center',marginBottom:16,marginTop:8}}>
                {MAT_STAGES.map((stage,i)=>{
                  const reached=i<=matIdx, isCurr=i===matIdx;
                  return (
                    <React.Fragment key={stage}>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1}}>
                        <div style={{width:32,height:32,borderRadius:'50%',
                          background:reached?MAT_COL[i]:'#F1F5F9',
                          border:`2px solid ${reached?MAT_COL[i]:'#E2E8F0'}`,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:11,fontWeight:800,color:reached?'white':'#CBD5E1',
                          boxShadow:isCurr?`0 0 0 5px ${MAT_COL[i]}25`:'none',
                          transition:'all 0.35s ease'}}>
                          {reached?'✓':i+1}
                        </div>
                        <div style={{fontSize:9,marginTop:6,textAlign:'center',lineHeight:1.3,
                          color:reached?MAT_COL[i]:'#CBD5E1',fontWeight:reached?700:400,maxWidth:52}}>
                          {stage}
                        </div>
                      </div>
                      {i<4&&<div style={{flex:1,height:2,marginBottom:26,
                        background:i<matIdx?MAT_COL[i]:'#E2E8F0',transition:'background 0.5s ease'}}/>}
                    </React.Fragment>
                  );
                })}
              </div>
              {riskScore&&(
                <div style={{display:'flex',alignItems:'center',gap:16,
                  borderTop:'1px solid var(--border)',paddingTop:14}}>
                  <Ring score={riskScore.score} size={72}/>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,color:riskCol(riskScore.score)}}>{riskScore.riskLevel} RISK</div>
                    <div style={{fontSize:12,color:'var(--text2)',marginTop:1}}>{riskScore.maturityLabel} Maturity</div>
                    <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>
                      {riskScore.coveredControls}/{riskScore.totalControls} controls ({riskScore.coveragePercentage}%)
                    </div>
                    {matIdx<4&&<div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>
                      {4-matIdx} stage{4-matIdx!==1?'s':''} to Optimizing
                    </div>}
                  </div>
                </div>
              )}
            </RCard>
          </div>
        </div>
      )}

      {/* ══════════ TAB 1 — GAP PRIORITISER ══════════ */}
      {tab==='rank'&&(
        <div style={SPLIT}>
          <div className="card" style={{display:'flex',flexDirection:'column',minHeight:500}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:3}}>🎯 Gap Priority Ranker</div>
                <div style={{fontSize:12.5,color:'var(--text2)'}}>AI analyses all open gaps and ranks them by remediation urgency with specific actions</div>
              </div>
              <button className="btn btn-primary btn-sm"
                onClick={()=>runAI(()=>aiInsightsAPI.rankGaps(10))} disabled={loading}
                style={{width:'auto',whiteSpace:'nowrap'}}>
                {loading?<><Spinner/> Analysing…</>:<>✨ Rank My Gaps</>}
              </button>
            </div>
            {result?.feature==='rank'
              ?<><AiText text={result.text} loading={false} engine={result.engine}/><Meta r={result}/></>
              :loading?<AiText text="" loading={true} engine={status?.activeEngine}/>
              :<Empty icon="🎯" title='Click "Rank My Gaps" to get started' sub={`${openGaps.length} open gaps ready to analyse`}/>}
          </div>
          <div style={RC}>
            <RCard title="Open Gaps by Severity">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={openSevBars} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                  <XAxis dataKey="name" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip content={<CTip/>}/>
                  <Bar dataKey="value" name="Open Gaps" radius={[4,4,0,0]}>
                    {openSevBars.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </RCard>
            <RCard title="Gap Status Breakdown">
              {statusPie.length===0
                ?<div style={{textAlign:'center',padding:'16px 0',color:'var(--text3)',fontSize:12}}>No data yet</div>
                :<div style={{display:'flex',alignItems:'center',gap:14}}>
                  <PieChart width={100} height={100}>
                    <Pie data={statusPie} cx={50} cy={50} innerRadius={26} outerRadius={46}
                      dataKey="value" stroke="white" strokeWidth={2}>
                      {statusPie.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    </Pie>
                  </PieChart>
                  <div style={{flex:1}}>
                    {statusPie.map((d,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5,fontSize:12}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:d.color}}/>
                        <span style={{color:'var(--text2)',flex:1}}>{d.name}</span>
                        <span style={{fontWeight:700,color:'var(--text)'}}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>}
            </RCard>
            <RCard title="Open Gaps by Framework">
              {fwGapBars.length===0
                ?<div style={{textAlign:'center',padding:'16px 0',color:'var(--text3)',fontSize:12}}>No data</div>
                :<ResponsiveContainer width="100%" height={150}>
                  <BarChart data={fwGapBars} barCategoryGap="22%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={<CTip/>}/>
                    <Bar dataKey="open"  name="Open"  fill="#EF4444" radius={[4,4,0,0]}/>
                    <Bar dataKey="total" name="Total" fill="#BFDBFE" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>}
            </RCard>
          </div>
        </div>
      )}

      {/* ══════════ TAB 2 — GAP EXPLAINER ══════════ */}
      {tab==='explain'&&(
        <div style={SPLIT}>
          <div className="card" style={{display:'flex',flexDirection:'column',minHeight:500}}>
            <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:3}}>📖 Policy Gap Explainer</div>
            <div style={{fontSize:12.5,color:'var(--text2)',marginBottom:16}}>Select a gap for a plain-English explanation with step-by-step remediation plan</div>
            <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
              <select value={selGap} onChange={e=>{setSelGap(e.target.value);setResult(null);}}
                style={{flex:1,minWidth:220,padding:'9px 12px',border:'1.5px solid var(--border)',
                  borderRadius:8,background:'var(--surface2)',fontSize:13,color:'var(--text)',
                  cursor:'pointer',fontFamily:'inherit'}}>
                {openGaps.length===0
                  ?<option value="">No open gaps found</option>
                  :openGaps.map(g=>(
                    <option key={g.id} value={g.id}>
                      [{g.severity}] {g.frameworkCode} · {g.controlCode} — {g.controlTitle.substring(0,50)}
                    </option>
                  ))}
              </select>
              <button className="btn btn-primary btn-sm"
                onClick={()=>runAI(()=>aiInsightsAPI.explainGap(selGap))}
                disabled={loading||!selGap}
                style={{width:'auto'}}>
                {loading?<><Spinner/> Explaining…</>:<>📖 Explain This Gap</>}
              </button>
            </div>
            {result?.feature==='explain'
              ?<><AiText text={result.text} loading={false} engine={result.engine}/><Meta r={result}/></>
              :loading?<AiText text="" loading={true} engine={status?.activeEngine}/>
              :<Empty icon="📖" title="Select a gap and click Explain" sub={`${openGaps.length} open gaps available`}/>}
          </div>
          <div style={RC}>
            {selGapObj&&(
              <RCard title="Selected Gap">
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{padding:'3px 10px',borderRadius:99,fontSize:11,fontWeight:800,
                      background:`${SEV_COL[selGapObj.severity]}18`,color:SEV_COL[selGapObj.severity],
                      border:`1px solid ${SEV_COL[selGapObj.severity]}35`}}>
                      {selGapObj.severity}
                    </span>
                    <span style={{fontSize:12,color:'var(--text3)'}}>{selGapObj.frameworkCode}</span>
                  </div>
                  <div style={{fontSize:13.5,fontWeight:700,color:'var(--text)',lineHeight:1.4}}>
                    {selGapObj.controlCode} — {selGapObj.controlTitle}
                  </div>
                  {selGapObj.description&&(
                    <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.55}}>{selGapObj.description}</div>
                  )}
                  <div>
                    <div style={{fontSize:10,color:'var(--text3)',marginBottom:5,fontWeight:700,letterSpacing:'0.07em'}}>IMPACT SCORE</div>
                    <div style={{height:7,background:'#F1F5F9',borderRadius:99,overflow:'hidden'}}>
                      <div style={{width:`${sevW(selGapObj.severity)}%`,height:'100%',
                        background:SEV_COL[selGapObj.severity],borderRadius:99,transition:'width 0.7s ease'}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:10,color:'var(--text3)'}}>
                      <span>0</span>
                      <span style={{fontWeight:700,color:SEV_COL[selGapObj.severity]}}>{sevW(selGapObj.severity)}/100</span>
                    </div>
                  </div>
                </div>
              </RCard>
            )}
            <RCard title="Open Gaps — Priority Scores">
              {prioBars.length===0
                ?<div style={{textAlign:'center',padding:'16px 0',color:'var(--text3)',fontSize:12}}>No open gaps</div>
                :<ResponsiveContainer width="100%" height={Math.max(120,prioBars.length*28+20)}>
                  <BarChart data={prioBars} layout="vertical" barCategoryGap="18%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false}/>
                    <XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:'#64748B'}}
                      axisLine={false} tickLine={false} width={54}/>
                    <Tooltip content={<CTip/>}/>
                    <Bar dataKey="score" name="Priority" radius={[0,4,4,0]}>
                      {prioBars.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>}
            </RCard>
            <RCard title="Framework Coverage Radar">
              {radarData.length===0
                ?<div style={{textAlign:'center',padding:'16px 0',color:'var(--text3)',fontSize:12}}>No data</div>
                :<ResponsiveContainer width="100%" height={170}>
                  <RadarChart data={radarData} cx="50%" cy="50%">
                    <PolarGrid stroke="#E2E8F0"/>
                    <PolarAngleAxis dataKey="fw" tick={{fontSize:10,fill:'#64748B'}}/>
                    <Radar name="Coverage %" dataKey="coverage"
                      stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.15} strokeWidth={2}/>
                    <Tooltip content={<CTip/>}/>
                  </RadarChart>
                </ResponsiveContainer>}
            </RCard>
          </div>
        </div>
      )}

      {/* ══════════ TAB 3 — COMPLIANCE Q&A — FULL WIDTH, UNTOUCHED ══════════ */}
      {tab==='chat'&&(
        <div className="card slide-in" style={{display:'flex',flexDirection:'column'}}>
          <div className="card-title" style={{marginBottom:4}}>💬 Compliance Q&amp;A</div>
          <div className="card-desc" style={{marginBottom:16}}>Ask anything about your compliance posture in plain English</div>
          {messages.length===0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',letterSpacing:'0.06em',marginBottom:8}}>
                SUGGESTED QUESTIONS
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {SUGGESTED.map(q=>(
                  <button key={q} onClick={()=>handleChat(q)}
                    style={{padding:'6px 12px',borderRadius:20,border:'1.5px solid var(--border)',
                      background:'var(--surface2)',fontSize:12,color:'var(--text2)',
                      cursor:'pointer',transition:'all 0.15s',fontFamily:'inherit'}}>{q}</button>
                ))}
              </div>
            </div>
          )}
          <div style={{minHeight:280,maxHeight:420,overflowY:'auto',
            display:'flex',flexDirection:'column',gap:12,marginBottom:16}}>
            {messages.map((m,i)=>(
              <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                <div style={{maxWidth:'80%',padding:'10px 14px',borderRadius:12,fontSize:13,lineHeight:1.6,
                  background:m.role==='user'?'#7C3AED':'var(--surface2)',
                  color:m.role==='user'?'white':'var(--text)',
                  borderBottomRightRadius:m.role==='user'?3:12,
                  borderBottomLeftRadius:m.role==='ai'?3:12}}>
                  {m.text.split('\n').map((l,j)=><div key={j}>{l||<span>&nbsp;</span>}</div>)}
                  {m.ms&&<div style={{fontSize:10,opacity:0.5,marginTop:4}}>{(m.ms/1000).toFixed(1)}s</div>}
                </div>
              </div>
            ))}
            {loading&&(
              <div style={{display:'flex',justifyContent:'flex-start'}}>
                <div style={{padding:'10px 16px',borderRadius:12,background:'var(--surface2)',display:'flex',gap:4}}>
                  {[0,1,2].map(d=><div key={d} style={{width:6,height:6,borderRadius:'50%',background:'#94A3B8',
                    animation:`pulse 1.2s ease-in-out ${d*0.2}s infinite`}}/>)}
                </div>
              </div>
            )}
            <div ref={chatEnd}/>
          </div>
          <div style={{display:'flex',gap:8}}>
            <input value={question} onChange={e=>setQuestion(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handleChat(question)}
              placeholder="Ask about your compliance status, gaps, frameworks…"
              disabled={loading}
              style={{flex:1,padding:'10px 14px',border:'1.5px solid var(--border)',
                borderRadius:8,fontSize:13,color:'var(--text)',
                background:'var(--surface2)',outline:'none',fontFamily:'inherit'}}/>
            <button onClick={()=>handleChat(question)} disabled={loading||!question.trim()}
              style={{padding:'10px 18px',borderRadius:8,border:'none',
                background:question.trim()?'#7C3AED':'var(--border)',
                color:question.trim()?'white':'var(--text3)',
                fontSize:13,fontWeight:600,fontFamily:'inherit',
                cursor:question.trim()?'pointer':'default',transition:'all 0.15s'}}>
              Send
            </button>
          </div>
          {messages.length>0&&(
            <button onClick={()=>setMessages([])}
              style={{marginTop:8,fontSize:11,color:'var(--text3)',
                background:'none',border:'none',cursor:'pointer',
                textAlign:'left',fontFamily:'inherit'}}>
              Clear conversation
            </button>
          )}
        </div>
      )}

      {/* ══════════ TAB 4 — EXECUTIVE BRIEF ══════════ */}
      {tab==='brief'&&(
        <div style={SPLIT}>
          <div className="card" style={{display:'flex',flexDirection:'column',minHeight:500}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:3}}>📊 Executive Health Brief</div>
                <div style={{fontSize:12.5,color:'var(--text2)'}}>Board-ready compliance posture summary — copy or share with leadership</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                {result?.feature==='brief'&&(
                  <button className="btn btn-secondary btn-sm"
                    onClick={()=>{navigator.clipboard.writeText(result.text);toast('Copied to clipboard','success');}}>
                    📋 Copy
                  </button>
                )}
                <button className="btn btn-primary btn-sm"
                  onClick={()=>runAI(()=>aiInsightsAPI.executiveBrief())} disabled={loading}
                  style={{width:'auto',whiteSpace:'nowrap'}}>
                  {loading?<><Spinner/> Generating…</>:<>📊 Generate Brief</>}
                </button>
              </div>
            </div>
            {result?.feature==='brief'
              ?<><AiText text={result.text} loading={false} engine={result.engine}/><Meta r={result}/></>
              :loading?<AiText text="" loading={true} engine={status?.activeEngine}/>
              :<Empty icon="📊" title='Click "Generate Brief" to create an executive summary'
                  sub="Synthesises live data from all frameworks, gaps, and risk scores"/>}
          </div>
          <div style={RC}>
            {riskScore&&(
              <RCard title="Compliance Health Score">
                <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:14}}>
                  <Ring score={riskScore.score} size={96}/>
                  <div>
                    <div style={{fontSize:18,fontWeight:800,color:riskCol(riskScore.score),lineHeight:1.1}}>
                      {riskScore.riskLevel} RISK
                    </div>
                    <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{riskScore.maturityLabel} Maturity</div>
                    <div style={{fontSize:11,color:'var(--text3)',marginTop:6}}>
                      {riskScore.coveredControls}/{riskScore.totalControls} controls ({riskScore.coveragePercentage}%)
                    </div>
                  </div>
                </div>
                <MBar label="Critical" val={riskScore.criticalGaps} max={Math.max(totalOpen,1)} col="#EF4444"/>
                <MBar label="High"     val={riskScore.highGaps}     max={Math.max(totalOpen,1)} col="#F97316"/>
                <MBar label="Medium"   val={riskScore.mediumGaps}   max={Math.max(totalOpen,1)} col="#EAB308"/>
                <MBar label="Low"      val={riskScore.lowGaps}      max={Math.max(totalOpen,1)} col="#22C55E"/>
              </RCard>
            )}
            <RCard title="Framework Coverage">
              {fwCovBars.length===0
                ?<div style={{textAlign:'center',padding:'16px 0',color:'var(--text3)',fontSize:12}}>Loading…</div>
                :<ResponsiveContainer width="100%" height={150}>
                  <BarChart data={fwCovBars} barCategoryGap="28%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CTip/>} formatter={(v:any)=>[`${v}%`,'Coverage']}/>
                    <Bar dataKey="pct" name="Coverage %" radius={[4,4,0,0]}>
                      {fwCovBars.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>}
            </RCard>
            <RCard title="Maturity Journey">
              <div style={{display:'flex',alignItems:'center',marginBottom:10}}>
                {MAT_STAGES.map((stage,i)=>{
                  const reached=i<=matIdx, isCurr=i===matIdx;
                  return (
                    <React.Fragment key={stage}>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1}}>
                        <div style={{width:26,height:26,borderRadius:'50%',
                          background:reached?MAT_COL[i]:'#F1F5F9',
                          border:`2px solid ${reached?MAT_COL[i]:'#E2E8F0'}`,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:10,fontWeight:800,color:reached?'white':'#CBD5E1',
                          boxShadow:isCurr?`0 0 0 4px ${MAT_COL[i]}30`:'none',
                          transition:'all 0.35s ease'}}>
                          {reached?'✓':i+1}
                        </div>
                        <div style={{fontSize:8,marginTop:4,textAlign:'center',
                          color:reached?MAT_COL[i]:'#CBD5E1',fontWeight:reached?700:400}}>
                          {stage.substring(0,6)}
                        </div>
                      </div>
                      {i<4&&<div style={{flex:1,height:2,marginBottom:16,
                        background:i<matIdx?MAT_COL[i]:'#E2E8F0',transition:'background 0.5s ease'}}/>}
                    </React.Fragment>
                  );
                })}
              </div>
              <div style={{fontSize:11.5,color:'var(--text2)',textAlign:'center'}}>
                Currently{' '}
                <strong style={{color:MAT_COL[matIdx]??'#64748B'}}>{riskScore?.maturityLabel??'–'}</strong>
                {matIdx<4&&<span style={{color:'var(--text3)'}}> — {4-matIdx} stage{4-matIdx!==1?'s':''} to Optimizing</span>}
              </div>
            </RCard>
          </div>
        </div>
      )}
    </div>
  );
}
