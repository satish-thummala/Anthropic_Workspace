import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ToastFn, ApiDocument } from '../../types/compliance.types';
import { documentAPI } from '../../services/document-api';
import { STATUS_MAP } from '../../constants/statusMaps';
import { Icons } from '../../components/shared/Icons';

interface Props { toast: ToastFn; }

// ── helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1_048_576)   return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function userName(): string {
  try {
    const u = JSON.parse(localStorage.getItem('compliance_user') ?? '{}');
    return u?.name ?? 'User';
  } catch { return 'User'; }
}

// ── component ─────────────────────────────────────────────────────────────────

export function DocumentsPage({ toast }: Props) {
  const [docs,       setDocs]       = useState<ApiDocument[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState('');
  const [dragging,   setDragging]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [analyzing,  setAnalyzing]  = useState<string | null>(null); // id of doc being analyzed

  const fileRef = useRef<HTMLInputElement>(null);

  // ── load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (kw?: string) => {
    try {
      setLoading(true);
      setError(null);
      setDocs(await documentAPI.getAll(kw));
    } catch {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced search — hits backend after 300 ms of no typing
  useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  // ── upload ────────────────────────────────────────────────────────────────
  // UPDATED: Now sends actual file to backend
  async function handleFiles(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Real file upload with multipart/form-data
        const doc = await documentAPI.uploadDocument(file, {
          name: file.name,
          description: `Uploaded by ${userName()}`,
          type: 'other', // You can make this smarter based on filename
          frameworkIds: '', // Empty for now, can be set later
        });
        
        // Prepend so new doc appears at top without a full reload
        setDocs(prev => [doc, ...prev]);
        toast(`${file.name} uploaded successfully`, 'success');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }

  // ── analyze ───────────────────────────────────────────────────────────────
  async function handleAnalyze(id: string, name: string) {
    setAnalyzing(id);
    try {
      const updated = await documentAPI.analyze(id);
      setDocs(prev => prev.map(d => d.id === id ? updated : d));
      toast(`${name} analyzed — coverage ${updated.coverageScore}%`, 'success');
    } catch {
      toast('Analysis failed', 'error');
    } finally {
      setAnalyzing(null);
    }
  }

  // ── delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: string, name: string) {
    try {
      await documentAPI.delete(id);
      setDocs(prev => prev.filter(d => d.id !== id));
      toast(`${name} removed`, 'info');
    } catch {
      toast('Delete failed', 'error');
    }
  }

  // ── stat strip counts ─────────────────────────────────────────────────────
  const counts = {
    total:      docs.length,
    analyzed:   docs.filter(d => d.status === 'analyzed').length,
    processing: docs.filter(d => d.status === 'processing').length,
    queued:     docs.filter(d => d.status === 'queued').length,
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="slide-in">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Document Ingestion</h1>
          <p>Upload and analyze compliance policies, SOPs, and governance documents</p>
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
            <div key={s.label} style={{
              padding: '5px 14px', borderRadius: 20, background: s.bg,
              border: `1px solid ${s.color}30`, fontSize: 12, fontWeight: 600, color: s.color,
            }}>
              {s.val} {s.label}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        className="card section-gap"
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
      >
        <div
          className={`upload-area${dragging ? ' dragging' : ''}`}
          onClick={() => !uploading && fileRef.current?.click()}
          style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1 }}
        >
          <div className="upload-icon">
            {uploading
              ? <span style={{ width: 28, height: 28, border: '3px solid var(--border2)',
                  borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block',
                  animation: 'spin 0.7s linear infinite' }} />
              : <Icons.Upload />}
          </div>
          <div className="upload-title">
            {uploading ? 'Uploading…' : 'Drop files here or click to upload'}
          </div>
          <div className="upload-sub">Supports PDF, DOCX, XLSX, TXT &mdash; up to 50 MB per file</div>
          <input
            ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.xlsx"
            style={{ display: 'none' }}
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Table card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="card-title">Uploaded Documents ({docs.length})</div>
          <div className="search-bar" style={{ margin: 0 }}>
            <div className="search-input-wrap" style={{ width: 220 }}>
              <Icons.Search />
              <input
                className="search-input"
                placeholder="Search documents…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)' }}>
            Loading documents…
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#DC2626' }}>
            {error}
            <button className="btn btn-secondary btn-sm" style={{ marginLeft: 12 }} onClick={() => load()}>
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Frameworks</th>
                  <th>Coverage</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>
                      {search
                        ? 'No documents match your search.'
                        : 'No documents yet — drop a file above to get started.'}
                    </td>
                  </tr>
                )}
                {docs.map(doc => {
                  const st = (STATUS_MAP as Record<string, { color: string; bg: string; label: string }>)[doc.status]
                           ?? STATUS_MAP.queued;
                  const canAnalyze = doc.status === 'queued' || doc.status === 'error' || doc.status === 'analyzed';

                  return (
                    <tr key={doc.id}>

                      {/* Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Icons.FileText style={{ width: 15, height: 15, color: 'var(--text3)', flexShrink: 0 }} />
                          <span style={{ fontWeight: 500 }}>{doc.name}</span>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--surface2)',
                          padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border)' }}>
                          {doc.type}
                        </span>
                      </td>

                      {/* Size */}
                      <td style={{ color: 'var(--text2)' }}>{doc.size}</td>

                      {/* Frameworks - FIXED: Added null check */}
                      <td>
                        {!doc.frameworks || doc.frameworks.length === 0
                          ? <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
                          : doc.frameworks.map(f => <span key={f} className="fw-badge">{f}</span>)
                        }
                      </td>

                      {/* Coverage bar */}
                      <td>
                        {doc.coverageScore !== null && doc.coverageScore !== undefined ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{
                                width: `${doc.coverageScore}%`, height: '100%', borderRadius: 99,
                                background: doc.coverageScore >= 80 ? '#22C55E'
                                           : doc.coverageScore >= 60 ? '#F59E0B' : '#EF4444',
                              }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{doc.coverageScore}%</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td>
                        <span className="badge" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>

                      {/* Uploaded date */}
                      <td style={{ color: 'var(--text2)', fontSize: 12 }}>
                        {doc.uploadedAt || '—'}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="td-actions">
                          {canAnalyze && (
                            <button
                              className="icon-btn"
                              onClick={() => handleAnalyze(doc.id, doc.name)}
                              title={doc.status === 'analyzed' ? 'Re-analyze' : 'Analyze'}
                              disabled={analyzing === doc.id}
                            >
                              {analyzing === doc.id
                                ? <span style={{ width: 11, height: 11, border: '2px solid var(--border2)',
                                    borderTopColor: 'var(--accent)', borderRadius: '50%',
                                    display: 'block', animation: 'spin 0.7s linear infinite' }} />
                                : <Icons.Play />}
                            </button>
                          )}
                          <button className="icon-btn"
                            onClick={() => toast(`Viewing ${doc.name}`, 'info')} title="View">
                            <Icons.Eye />
                          </button>
                          <button className="icon-btn btn-danger"
                            onClick={() => handleDelete(doc.id, doc.name)} title="Delete">
                            <Icons.Trash />
                          </button>
                        </div>
                      </td>

                    </tr>
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
