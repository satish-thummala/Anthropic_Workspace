import React, { useState, useRef } from 'react';
import type { ToastFn, ComplianceDocument } from '../../types/compliance.types';
import { INITIAL_DOCUMENTS } from '../../constants/mockData';
import { STATUS_MAP } from '../../constants/statusMaps';
import { Icons } from '../../components/shared/Icons';

interface DocumentsPageProps { toast: ToastFn; }

export function DocumentsPage({ toast }: DocumentsPageProps) {
  const [docs, setDocs]         = useState<ComplianceDocument[]>(INITIAL_DOCUMENTS);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [search, setSearch]     = useState('');
  const fileRef                 = useRef<HTMLInputElement>(null);

  function simulateUpload(name: string, size: string) {
    const id  = Date.now();
    const ext = name.split('.').pop()?.toUpperCase() ?? 'FILE';
    setDocs((d) => [...d, { id, name, type: ext, size, status: 'processing', uploadedAt: new Date().toISOString().split('T')[0], frameworks: [], coverageScore: null }]);
    toast(`Uploading ${name}…`, 'info');
    setTimeout(() => {
      setDocs((d) => d.map((doc) => doc.id === id ? { ...doc, status: 'queued' } : doc));
      setTimeout(() => {
        setDocs((d) => d.map((doc) => doc.id === id ? { ...doc, status: 'analyzed', frameworks: ['ISO27001'], coverageScore: Math.floor(60 + Math.random() * 35) } : doc));
        toast(`${name} analyzed successfully`, 'success');
      }, 2500);
    }, 1500);
  }

  function handleFiles(files: FileList) {
    Array.from(files).forEach((f) => {
      const size = f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`;
      simulateUpload(f.name, size);
    });
  }

  async function analyzeDoc(id: number) {
    setAnalyzing(id);
    await new Promise((r) => setTimeout(r, 1800));
    setDocs((d) => d.map((doc) => doc.id === id ? { ...doc, status: 'analyzed', frameworks: ['ISO27001', 'SOC2'], coverageScore: Math.floor(65 + Math.random() * 30) } : doc));
    setAnalyzing(null);
    toast('Document analysis complete', 'success');
  }

  function deleteDoc(id: number) {
    setDocs((d) => d.filter((doc) => doc.id !== id));
    toast('Document removed', 'info');
  }

  const filtered = docs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="slide-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Document Ingestion</h1>
          <p>Upload and analyze compliance policies, SOPs, and governance documents</p>
        </div>
      </div>

      <div
        className="card section-gap"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
      >
        <div className={`upload-area${dragging ? ' dragging' : ''}`} onClick={() => fileRef.current?.click()}>
          <div className="upload-icon"><Icons.Upload /></div>
          <div className="upload-title">Drop files here or click to upload</div>
          <div className="upload-sub">Supports PDF, DOCX, XLSX, TXT &mdash; up to 50 MB per file</div>
          <input
            ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.xlsx"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="card-title">Uploaded Documents ({docs.length})</div>
          <div className="search-bar" style={{ margin: 0 }}>
            <div className="search-input-wrap" style={{ width: 220 }}>
              <Icons.Search />
              <input className="search-input" placeholder="Search documents…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Document Name</th><th>Type</th><th>Size</th><th>Frameworks</th>
                <th>Coverage</th><th>Status</th><th>Uploaded</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const st = STATUS_MAP[doc.status] ?? STATUS_MAP.queued;
                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icons.FileText style={{ width: 15, height: 15, color: 'var(--text3)', flexShrink: 0 }} />
                        <span style={{ fontWeight: 500 }}>{doc.name}</span>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--surface2)', padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border)' }}>{doc.type}</span></td>
                    <td style={{ color: 'var(--text2)' }}>{doc.size}</td>
                    <td>{doc.frameworks.map((f) => <span key={f} className="fw-badge">{f}</span>)}</td>
                    <td>
                      {doc.coverageScore !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${doc.coverageScore}%`, height: '100%', background: doc.coverageScore >= 80 ? '#22C55E' : doc.coverageScore >= 60 ? '#F59E0B' : '#EF4444', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{doc.coverageScore}%</span>
                        </div>
                      ) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>&mdash;</span>}
                    </td>
                    <td><span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{doc.uploadedAt}</td>
                    <td>
                      <div className="td-actions">
                        {(doc.status === 'analyzed' || doc.status === 'queued') && (
                          <button className="icon-btn" onClick={() => analyzeDoc(doc.id)} title="Re-analyze">
                            {analyzing === doc.id
                              ? <span className="spin" style={{ width: 11, height: 11, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'block' }} />
                              : <Icons.Play />}
                          </button>
                        )}
                        <button className="icon-btn" onClick={() => toast(`Viewing ${doc.name}`, 'info')} title="View"><Icons.Eye /></button>
                        <button className="icon-btn btn-danger" onClick={() => deleteDoc(doc.id)} title="Delete"><Icons.Trash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
