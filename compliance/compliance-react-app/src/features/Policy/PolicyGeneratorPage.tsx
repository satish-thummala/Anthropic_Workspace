import React, { useState, useEffect } from 'react';
import type { ToastFn, ApiDocument } from '../../types/compliance.types';
import {
  policyAPI,
  type PolicyTypeInfo,
  type PolicyTypeId,
  type PolicyGenerateResponse,
} from '../../services/policy-api';
import { Icons } from '../../components/shared/Icons';

interface Props { toast: ToastFn; }

// ── Constants ─────────────────────────────────────────────────────────────────

const FRAMEWORKS = [
  { code: '',        label: 'No specific framework' },
  { code: 'ISO27001',label: 'ISO/IEC 27001' },
  { code: 'SOC2',    label: 'SOC 2 Type II' },
  { code: 'GDPR',    label: 'GDPR' },
  { code: 'HIPAA',   label: 'HIPAA Security Rule' },
];

const FRAMEWORK_COLORS: Record<string, string> = {
  ISO27001: '#3B82F6',
  SOC2:     '#8B5CF6',
  GDPR:     '#10B981',
  HIPAA:    '#F59E0B',
};

// ── Markdown renderer — handles headings, tables, bullets, bold ──────────────

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split('\n');
  const nodes: React.ReactNode[] = [];
  let tableBuffer: string[] = [];
  let key = 0;

  const flushTable = () => {
    if (tableBuffer.length < 2) { tableBuffer = []; return; }
    const rows = tableBuffer.map(r =>
      r.split('|').map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1)
    ).filter(r => r.length > 0 && !r.every(c => /^[-:]+$/.test(c)));

    if (rows.length === 0) { tableBuffer = []; return; }
    nodes.push(
      <div key={key++} style={{ overflowX: 'auto', margin: '14px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {rows[0].map((cell, i) => (
                <th key={i} style={{ padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', fontWeight: 600, textAlign: 'left', fontSize: 12 }}>
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'var(--surface2)' }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: '7px 12px', border: '1px solid var(--border)', fontSize: 13 }}>
                    {parseBold(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table rows
    if (line.trim().startsWith('|')) {
      tableBuffer.push(line);
      continue;
    } else if (tableBuffer.length > 0) {
      flushTable();
    }

    // Headings
    if (line.startsWith('# ')) {
      nodes.push(<h1 key={key++} style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 16px', paddingBottom: 12, borderBottom: '2px solid var(--accent)' }}>{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      nodes.push(<h2 key={key++} style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '24px 0 10px', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      nodes.push(<h3 key={key++} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '16px 0 8px' }}>{line.slice(4)}</h3>);
    // Horizontal rule
    } else if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={key++} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />);
    // Numbered list
    } else if (/^\d+\.\s/.test(line)) {
      nodes.push(
        <div key={key++} style={{ display: 'flex', gap: 10, margin: '4px 0', fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0, minWidth: 20 }}>{line.match(/^\d+/)![0]}.</span>
          <span>{parseBold(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    // Bullet list
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      nodes.push(
        <div key={key++} style={{ display: 'flex', gap: 10, margin: '4px 0', fontSize: 13, color: 'var(--text)', lineHeight: 1.6, paddingLeft: 4 }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>•</span>
          <span>{parseBold(line.slice(2))}</span>
        </div>
      );
    // Blank line
    } else if (line.trim() === '') {
      nodes.push(<div key={key++} style={{ height: 6 }} />);
    // Normal paragraph
    } else if (line.trim() !== '') {
      nodes.push(
        <p key={key++} style={{ fontSize: 13, color: 'var(--text)', margin: '4px 0', lineHeight: 1.7 }}>
          {parseBold(line)}
        </p>
      );
    }
  }
  if (tableBuffer.length > 0) flushTable();
  return nodes;
}

function parseBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ fontWeight: 600, color: 'var(--text)' }}>{part}</strong>
      : part
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
  );
}

// ── Engine badge ──────────────────────────────────────────────────────────────

function EngineBadge({ engine }: { engine: string }) {
  const isGroq = engine === 'groq';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: isGroq ? '#EFF6FF' : '#F0FDF4', color: isGroq ? '#1D4ED8' : '#16A34A', border: `1px solid ${isGroq ? '#BFDBFE' : '#BBF7D0'}` }}>
      {isGroq ? '⚡ Groq AI' : '📋 Template'}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PolicyGeneratorPage({ toast }: Props) {
  const [types,          setTypes]          = useState<PolicyTypeInfo[]>([]);
  const [selectedType,   setSelectedType]   = useState<PolicyTypeId | ''>('');
  const [selectedFw,     setSelectedFw]     = useState('');
  const [orgName,        setOrgName]        = useState('');
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState<PolicyGenerateResponse | null>(null);
  const [copied,         setCopied]         = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [savedDoc,       setSavedDoc]       = useState<ApiDocument | null>(null);

  // Load policy types on mount
  useEffect(() => {
    policyAPI.getTypes()
      .then(setTypes)
      .catch(() => {/* types unavailable — not fatal, user can still generate */});
  }, []);

  // ── Generate ───────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!selectedType) { toast('Please select a policy type', 'error'); return; }
    setLoading(true);
    setResult(null);
    setSavedDoc(null);
    try {
      const response = await policyAPI.generate({
        type:          selectedType as PolicyTypeId,
        frameworkCode: selectedFw,
        orgName:       orgName.trim() || undefined,
      });
      setResult(response);
      if (response.engine === 'none') {
        toast('Generation failed — please try again', 'error');
      } else {
        toast(`Policy generated via ${response.engine === 'groq' ? 'Groq AI' : 'template engine'}`, 'success');
      }
    } catch {
      toast('Failed to generate policy', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ── Copy to clipboard ──────────────────────────────────────────────────────
  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      toast('Policy copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Copy failed — please select and copy manually', 'error');
    }
  }

  // ── Download as .md file ───────────────────────────────────────────────────
  function handleDownload() {
    if (!result) return;
    const blob = new Blob([result.content], { type: 'text/markdown;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${result.policyType}_policy_${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Policy downloaded as Markdown', 'success');
  }

  // ── Save to Documents — closes the loop with gap detection ────────────────
  async function handleSaveToDocuments() {
    if (!result || saving) return;

    setSaving(true);
    try {
      // Get the logged-in user's name from localStorage (same pattern as DocumentsPage)
      let savedByName = 'Policy Generator';
      try {
        const u = JSON.parse(localStorage.getItem('compliance_user') ?? '{}');
        if (u?.name) savedByName = u.name;
      } catch { /* keep default */ }

      const doc = await policyAPI.saveToDocuments(result, savedByName);
      setSavedDoc(doc);
      toast(
        `Policy saved to Documents — run "Analyze for Gaps" on it to verify coverage`,
        'success',
      );
    } catch {
      toast('Failed to save policy to Documents', 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── Selected type info ─────────────────────────────────────────────────────
  const typeInfo = types.find(t => t.id === selectedType);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="slide-in">

      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Policy Generator</h1>
          <p>Generate audit-ready compliance policy documents aligned to your frameworks using AI</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '340px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left panel — controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Policy type picker */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Policy Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(types.length > 0 ? types : FALLBACK_TYPES).map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  style={{
                    padding: '11px 14px', borderRadius: 8, textAlign: 'left',
                    border: selectedType === type.id ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                    background: selectedType === type.id ? 'var(--accent)08' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: selectedType === type.id ? 'var(--accent)' : 'var(--text)', marginBottom: 2 }}>
                    {type.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Framework selector */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Framework Alignment</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {FRAMEWORKS.map(fw => {
                const color = FRAMEWORK_COLORS[fw.code] ?? '#64748B';
                const isSelected = selectedFw === fw.code;
                return (
                  <button
                    key={fw.code}
                    onClick={() => setSelectedFw(fw.code)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 7, textAlign: 'left',
                      border: isSelected ? `2px solid ${color}` : '1.5px solid var(--border)',
                      background: isSelected ? `${color}10` : 'transparent',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {fw.code && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? color : 'var(--text2)' }}>
                      {fw.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {typeInfo && selectedFw && !typeInfo.compatibleFrameworks.includes(selectedFw) && (
              <div style={{ marginTop: 10, padding: '8px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, fontSize: 11, color: '#92400E' }}>
                ⚠ {typeInfo.label} has limited coverage for {selectedFw}. The policy will still be generated.
              </div>
            )}
          </div>

          {/* Org name */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 10 }}>Organisation Name</div>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="e.g. Acme Corp"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, fontFamily: 'var(--sans)', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
              Embedded in the policy header and ownership clauses
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !selectedType}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !selectedType ? 0.5 : 1 }}
          >
            {loading ? (
              <><Spinner /> Generating Policy…</>
            ) : (
              <><Icons.Zap style={{ width: 16, height: 16 }} /> Generate Policy</>
            )}
          </button>

          {/* Loading state hint */}
          {loading && (
            <div style={{ padding: '12px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 12, color: '#1D4ED8', textAlign: 'center' }}>
              AI is drafting your policy document…<br />
              <span style={{ color: '#3B82F6', fontSize: 11 }}>This usually takes 5–15 seconds</span>
            </div>
          )}
        </div>

        {/* ── Right panel — output ── */}
        {result && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

            {/* Output header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'var(--surface2)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {result.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>Generated {new Date(result.generatedAt).toLocaleString()}</span>
                  <span>·</span>
                  <span>{result.durationMs}ms</span>
                  <span>·</span>
                  <EngineBadge engine={result.engine} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCopy}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                  title="Copy policy to clipboard"
                >
                  {copied ? <Icons.Check style={{ width: 13, height: 13 }} /> : <Icons.FileText style={{ width: 13, height: 13 }} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                  title="Download as Markdown file"
                >
                  <Icons.Download style={{ width: 13, height: 13 }} />
                  Download .md
                </button>
                {/* Save to Documents — closes the loop with gap detection */}
                {savedDoc ? (
                  <button
                    disabled
                    className="btn btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', cursor: 'default' }}
                    title="Already saved to Documents"
                  >
                    <Icons.Check style={{ width: 13, height: 13 }} />
                    Saved to Docs
                  </button>
                ) : (
                  <button
                    onClick={handleSaveToDocuments}
                    disabled={saving}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                    title="Save to Documents module — enables gap detection on this policy"
                  >
                    {saving
                      ? <span style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      : <Icons.Upload style={{ width: 13, height: 13 }} />
                    }
                    {saving ? 'Saving…' : 'Save to Docs'}
                  </button>
                )}
                <button
                  onClick={() => { setResult(null); setSavedDoc(null); }}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                  title="Clear and generate a new policy"
                >
                  <Icons.X style={{ width: 13, height: 13 }} />
                  Clear
                </button>
              </div>
            </div>

            {/* Saved to Documents confirmation banner */}
            {savedDoc && (
              <div style={{
                margin: '0',
                padding: '12px 20px',
                background: '#F0FDF4',
                borderBottom: '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <Icons.Check style={{ width: 16, height: 16, color: '#16A34A', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#15803D' }}>
                    Saved to Documents
                  </span>
                  <span style={{ fontSize: 12, color: '#166534', marginLeft: 8 }}>
                    Go to the Documents page, find <strong>{savedDoc.name}</strong>, and click
                    <strong> "Analyze for Gaps"</strong> to verify this policy covers the right controls.
                  </span>
                </div>
              </div>
            )}

            {/* Rendered policy content */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
              {renderMarkdown(result.content)}
            </div>
          </div>
        )}

        {/* Empty state when no result yet */}
        {!result && !loading && (
          <div style={{ display: 'none' }} />
        )}
      </div>

      {/* Full-width placeholder when no result */}
      {!result && !loading && (
        <div className="card" style={{ marginTop: 0, padding: '48px 0', textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
            Select a policy type to get started
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', maxWidth: 480, margin: '0 auto' }}>
            Choose a policy type and optionally a framework from the panel on the left,
            then click Generate Policy. The document will appear here, ready to copy or download.
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback type list shown if API call fails on mount
const FALLBACK_TYPES = [
  { id: 'access_control'      as PolicyTypeId, label: 'Access Control Policy',      description: 'User access, authentication, least privilege' },
  { id: 'incident_response'   as PolicyTypeId, label: 'Incident Response Policy',   description: 'Security incident detection and response' },
  { id: 'data_protection'     as PolicyTypeId, label: 'Data Protection Policy',     description: 'Data classification, handling, and rights' },
  { id: 'acceptable_use'      as PolicyTypeId, label: 'Acceptable Use Policy',      description: 'IT systems and device usage rules' },
  { id: 'business_continuity' as PolicyTypeId, label: 'Business Continuity Policy', description: 'RTO/RPO, backups, and disaster recovery' },
];
