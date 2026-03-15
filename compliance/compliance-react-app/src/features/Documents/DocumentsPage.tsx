import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ToastFn, ApiDocument } from '../../types/compliance.types';
import { documentAPI } from '../../services/document-api';
import { gapDetectionAPI, type GapDetectionResponse } from '../../services/gap-detection-api';
import { useGapCount } from '../../contexts/GapCountContext';
import { STATUS_MAP } from '../../constants/statusMaps';
import { Icons } from '../../components/shared/Icons';
import { GapDetectionResultsPanel } from './GapDetectionResultsPanel';
import { FilePreviewModal } from './FilePreviewModal';

interface Props { toast: ToastFn; }

// ── helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1_048_576)  return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function userName(): string {
  try {
    const u = JSON.parse(localStorage.getItem('compliance_user') ?? '{}');
    return u?.name ?? 'User';
  } catch { return 'User'; }
}

// ── Extraction badge ──────────────────────────────────────────────────────────

function ExtractionBadge({ status, charCount }: { status?: string; charCount?: number }) {
  if (!status) return null;
  const cfg: Record<string, { label: string; bg: string; color: string; title: string }> = {
    SUCCESS:   { label: `✓ ${charCount ? charCount.toLocaleString() + ' chars' : 'Extracted'}`, bg: '#F0FDF4', color: '#16A34A', title: 'Text extracted — Analyze for Gaps is available' },
    TRUNCATED: { label: `⚡ ${charCount ? charCount.toLocaleString() + ' chars' : 'Truncated'}`, bg: '#FFFBEB', color: '#D97706', title: 'Large file truncated — gap detection still works' },
    NO_TEXT:   { label: '⚠ No text',        bg: '#FFF7ED', color: '#EA580C', title: 'No extractable text — gap detection unavailable' },
    FAILED:    { label: '✗ Extract failed', bg: '#FEF2F2', color: '#DC2626', title: 'Extraction failed — gap detection unavailable' },
  };
  const c = cfg[status];
  if (!c) return null;
  return (
    <span title={c.title} style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: c.bg, color: c.color, cursor: 'help', whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
}

const DOC_TYPES = [
  { value: 'policy',    label: 'Policy' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'evidence',  label: 'Evidence' },
  { value: 'other',     label: 'Other' },
];

// ── component ─────────────────────────────────────────────────────────────────

export function DocumentsPage({ toast }: Props) {
  const [docs,          setDocs]          = useState<ApiDocument[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [search,        setSearch]        = useState('');
  const [dragging,      setDragging]      = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [analyzing,     setAnalyzing]     = useState<string | null>(null);
  const [gapAnalyzing,  setGapAnalyzing]  = useState<string | null>(null);
  const [gapResults,    setGapResults]    = useState<Record<string, GapDetectionResponse>>({});
  const [pendingFile,   setPendingFile]   = useState<File | null>(null);
  const [docType,       setDocType]       = useState('policy');
  const [docFrameworks, setDocFrameworks] = useState('');
  const [previewFile, setPreviewFile] = useState<{url: string; name: string; type: string; } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Live sidebar badge — refreshes when gap detection creates new gaps ──────
  const { refreshGapCount } = useGapCount();

  // ── Load documents ────────────────────────────────────────────────────────
  const load = useCallback(async (kw?: string) => {
    try {
      setLoading(true); setError(null);
      setDocs(await documentAPI.getAll(kw));
    } catch { setError('Failed to load documents'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  // ── Upload handlers ───────────────────────────────────────────────────────
  function handleFileSelect(files: FileList | null) {
    if (!files?.length) return;
    setPendingFile(files[0]);
    setDocType('policy');
    setDocFrameworks('');
  }

  function cancelUpload() {
    setPendingFile(null);
    setDocType('policy');
    setDocFrameworks('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function executeUpload() {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const doc = await documentAPI.uploadDocument(pendingFile, {
        name: pendingFile.name,
        description: `Uploaded by ${userName()}`,
        type: docType,
        frameworkIds: docFrameworks,
      });
      setDocs(prev => [doc, ...prev]);
      toast(`${pendingFile.name} uploaded & text extracted`, 'success');
      cancelUpload();
    } catch { toast('Upload failed', 'error'); }
    finally  { setUploading(false); }
  }

  // ── Tika re-extract ───────────────────────────────────────────────────────
  async function handleAnalyze(id: string, name: string) {
    setAnalyzing(id);
    try {
      const updated = await documentAPI.analyze(id);
      setDocs(prev => prev.map(d => d.id === id ? updated : d));
      toast(`${name} re-analyzed — coverage ${updated.coverageScore}%`, 'success');
    } catch { toast('Re-analysis failed', 'error'); }
    finally  { setAnalyzing(null); }
  }

  async function handlePreview(doc: ApiDocument) {
    setPreviewFile({
      url: doc.fileUrl,
      name: doc.name,
      type: doc.fileType,
    });
  }

  // ── Gap detection — calls backend NLP pipeline, refreshes sidebar badge ───
  async function handleAnalyzeForGaps(doc: ApiDocument) {
    const { id, name } = doc;

    // Toggle off if panel already open for this doc
    if (gapResults[id]) {
      setGapResults(prev => { const n = { ...prev }; delete n[id]; return n; });
      return;
    }

    setGapAnalyzing(id);
    try {
      const result = await gapDetectionAPI.analyzeDocument(id);
      setGapResults(prev => ({ ...prev, [id]: result }));

      if (!result.success) {
        toast(result.message, 'error');
      } else {
        const gaps = result.summary?.gapsDetected ?? 0;
        toast(
          gaps > 0
            ? `${name} — ${gaps} gap${gaps !== 1 ? 's' : ''} detected and saved to Gaps`
            : `${name} — no gaps found, all controls covered!`,
          gaps > 0 ? 'info' : 'success',
        );

        // Refresh the sidebar "Gap Analysis" badge to reflect newly-created gaps
        if (gaps > 0) {
          refreshGapCount();
        }
      }
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Gap analysis failed', 'error');
    } finally { setGapAnalyzing(null); }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: string, name: string) {
    try {
      await documentAPI.delete(id);
      setDocs(prev => prev.filter(d => d.id !== id));
      setGapResults(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast(`${name} removed`, 'info');
    } catch { toast('Delete failed', 'error'); }
  }

  // ── Derived counts ────────────────────────────────────────────────────────
  const counts = {
    total:      docs.length,
    analyzed:   docs.filter(d => d.status === 'analyzed').length,
    processing: docs.filter(d => d.status === 'processing').length,
    queued:     docs.filter(d => d.status === 'queued').length,
  };

  // Gap detection only available when text was successfully extracted
  function canDetectGaps(doc: ApiDocument): boolean {
    const ex = (doc as any).extractionStatus as string | undefined;
    return ex === 'SUCCESS' || ex === 'TRUNCATED';
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="slide-in">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Document Ingestion</h1>
          <p>Upload policies — Apache Tika extracts text, then detect missing compliance controls automatically</p>
        </div>
      </div>

      {/* Stat strip */}
      {!loading && docs.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',      val: counts.total,      color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Analyzed',   val: counts.analyzed,   color: '#16A34A', bg: '#F0FDF4' },
            { label: 'Processing', val: counts.processing, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Queued',     val: counts.queued,     color: '#64748B', bg: '#F8FAFC' },
          ].map(s => (
            <div key={s.label} style={{ padding: '5px 14px', borderRadius: 20, background: s.bg, border: `1px solid ${s.color}30`, fontSize: 12, fontWeight: 600, color: s.color }}>
              {s.val} {s.label}
            </div>
          ))}
        </div>
      )}

      {/* Upload card */}
      <div
        className="card section-gap"
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files); }}
      >
        {!pendingFile ? (

          /* ── State A: empty drop zone ── */
          <div
            className={`upload-area${dragging ? ' dragging' : ''}`}
            onClick={() => !uploading && fileRef.current?.click()}
            style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1 }}
          >
            <div className="upload-icon"><Icons.Upload /></div>
            <div className="upload-title">Drop a file here or click to upload</div>
            <div className="upload-sub">
              PDF, DOCX, XLSX, TXT — up to 50 MB
              <br />
              <span style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, display: 'block' }}>
                Apache Tika extracts text automatically · Use "Analyze for Gaps" on each row to detect missing controls
              </span>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.xlsx" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files)} />
          </div>

        ) : (

          /* ── State B: file staged — inline form inside the card ── */
          <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: 600, width: '100%' }}>

              {/* File preview chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--surface2)', borderRadius: 8, marginBottom: 20 }}>
                <Icons.FileText style={{ width: 20, height: 20, color: 'var(--accent)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingFile.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{formatBytes(pendingFile.size)}</div>
                </div>
                <button onClick={cancelUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18 }} title="Cancel">×</button>
              </div>

              {/* Document type */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Document Type</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {DOC_TYPES.map(t => (
                    <button key={t.value} onClick={() => setDocType(t.value)} style={{
                      padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      border: docType === t.value ? '2px solid var(--accent)' : '2px solid var(--border)',
                      background: docType === t.value ? 'var(--accent)10' : 'transparent',
                      color: docType === t.value ? 'var(--accent)' : 'var(--text2)',
                    }}>{t.label}</button>
                  ))}
                </div>
              </div>

              {/* Framework hint */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
                  Framework Hint <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional — Tika auto-detects from content)</span>
                </label>
                <input
                  type="text" value={docFrameworks} onChange={e => setDocFrameworks(e.target.value)}
                  placeholder="e.g. ISO27001,SOC2"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--mono)' }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={cancelUpload} disabled={uploading} className="btn btn-secondary" style={{ minWidth: 100 }}>Cancel</button>
                <button onClick={executeUpload} disabled={uploading} className="btn btn-primary" style={{ minWidth: 160 }}>
                  {uploading
                    ? <><span style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', marginRight: 8 }} />Uploading...</>
                    : <><Icons.Upload style={{ width: 16, height: 16, marginRight: 6 }} />Upload & Extract</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="card-title">Uploaded Documents ({docs.length})</div>
          <div className="search-bar" style={{ margin: 0 }}>
            <div className="search-input-wrap" style={{ width: 220 }}>
              <Icons.Search />
              <input className="search-input" placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {loading && <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)' }}>Loading documents…</div>}

        {error && !loading && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#DC2626' }}>
            {error}
            <button className="btn btn-secondary btn-sm" style={{ marginLeft: 12 }} onClick={() => load()}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Frameworks</th>
                  <th>Extraction</th>
                  <th>Coverage</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>

                {docs.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>
                      {search ? 'No documents match your search.' : 'No documents yet — drop a file above to get started.'}
                    </td>
                  </tr>
                )}

                {docs.map(doc => {
                  const st              = (STATUS_MAP as Record<string, { color: string; bg: string; label: string }>)[doc.status] ?? STATUS_MAP.queued;
                  const isGapAnalyzing  = gapAnalyzing === doc.id;
                  const hasGapResult    = !!gapResults[doc.id];
                  const gapReady        = canDetectGaps(doc);
                  const isTikaAnalyzing = analyzing === doc.id;
                  const canTikaAnalyze  = doc.status === 'queued' || doc.status === 'error' || doc.status === 'analyzed';

                  return (
                    <React.Fragment key={doc.id}>
                      <tr style={{ background: hasGapResult ? '#F8FAFF' : undefined }}>

                        {/* Name */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Icons.FileText style={{ width: 15, height: 15, color: 'var(--text3)', flexShrink: 0 }} />
                            <span style={{ fontWeight: 500 }}>{doc.name}</span>
                          </div>
                        </td>

                        {/* Doc type */}
                        <td>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--surface2)', padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border)' }}>
                            {doc.type || '—'}
                          </span>
                        </td>

                        {/* Size */}
                        <td style={{ color: 'var(--text2)' }}>{doc.size || '—'}</td>

                        {/* Frameworks */}
                        <td>
                          {!doc.frameworks?.length
                            ? <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
                            : doc.frameworks.map(f => <span key={f} className="fw-badge">{f}</span>)
                          }
                        </td>

                        {/* Extraction badge */}
                        <td>
                          <ExtractionBadge status={(doc as any).extractionStatus} charCount={(doc as any).charCount} />
                        </td>

                        {/* Coverage bar */}
                        <td>
                          {doc.coverageScore != null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 60, height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${doc.coverageScore}%`, height: '100%', borderRadius: 99, background: doc.coverageScore >= 80 ? '#22C55E' : doc.coverageScore >= 60 ? '#F59E0B' : '#EF4444' }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{doc.coverageScore}%</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
                          )}
                        </td>

                        {/* Status badge */}
                        <td>
                          <span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </td>

                        {/* Upload date */}
                        <td style={{ color: 'var(--text2)', fontSize: 12 }}>{doc.uploadedAt || '—'}</td>

                        {/* Actions */}
                        <td>
                          <div className="td-actions" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                            {/* ── PRIMARY ACTION: Analyze for Gaps ── */}
                            {gapReady && (
                              <button
                                onClick={() => handleAnalyzeForGaps(doc)}
                                disabled={isGapAnalyzing}
                                title={hasGapResult ? 'Hide gap results' : 'Run NLP gap detection against all framework controls'}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 5,
                                  padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                  border: '1.5px solid',
                                  borderColor: hasGapResult ? 'var(--border)' : '#1D4ED8',
                                  background:  hasGapResult ? 'var(--surface2)' : '#1D4ED8',
                                  color:       hasGapResult ? 'var(--text2)' : 'white',
                                  cursor: isGapAnalyzing ? 'wait' : 'pointer',
                                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                                }}
                              >
                                {isGapAnalyzing ? (
                                  <>
                                    <span style={{ width: 11, height: 11, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                    Analyzing…
                                  </>
                                ) : (
                                  <>
                                    <Icons.Zap style={{ width: 12, height: 12 }} />
                                    {hasGapResult ? 'Hide Gaps' : 'Analyze for Gaps'}
                                  </>
                                )}
                              </button>
                            )}

                            {/* Tika re-extract (icon only — secondary) */}
                            {canTikaAnalyze && (
                              <button className="icon-btn" onClick={() => handleAnalyze(doc.id, doc.name)} disabled={isTikaAnalyzing} title="Re-extract text with Tika">
                                {isTikaAnalyzing
                                  ? <span style={{ width: 11, height: 11, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'block', animation: 'spin 0.7s linear infinite' }} />
                                  : <Icons.Play />
                                }
                              </button>
                            )}

                            <button className="icon-btn" onClick={() => handlePreview(doc)} title="Preview Document" style={{ background: '#f3f4f6', color: '#374151' }}><Icons.Eye /></button>
                            <button className="icon-btn btn-danger" onClick={() => handleDelete(doc.id, doc.name)} title="Delete"><Icons.Trash /></button>
                            {previewFile && (
                              <FilePreviewModal
                                fileUrl={previewFile.url}
                                fileName={previewFile.name}
                                fileType={previewFile.type}
                                onClose={() => setPreviewFile(null)}
                              />
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ── Gap results panel — full-width row directly below the document ── */}
                      {hasGapResult && (
                        <tr>
                          <td colSpan={9} style={{ padding: '0 0 20px 0', background: 'transparent' }}>
                            <GapDetectionResultsPanel
                              result={gapResults[doc.id]}
                              onClose={() => setGapResults(prev => { const n = { ...prev }; delete n[doc.id]; return n; })}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
