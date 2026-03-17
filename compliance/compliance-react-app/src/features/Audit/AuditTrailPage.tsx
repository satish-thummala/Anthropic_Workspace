import React, { useState, useEffect, useCallback } from 'react';
import type { ToastFn } from '../../types/compliance.types';
import {
  auditAPI,
  type AuditLogEntry,
  type AuditStats,
  type AuditActionOption,
  type AuditFilters,
} from '../../services/audit-api';
import { Icons } from '../../components/shared/Icons';

interface Props { toast: ToastFn; }

// ── Action colour coding ───────────────────────────────────────────────────────

const ACTION_META: Record<string, { color: string; bg: string; icon: string }> = {
  USER_LOGIN:                 { color: '#16A34A', bg: '#F0FDF4', icon: '→' },
  USER_LOGOUT:                { color: '#64748B', bg: '#F8FAFC', icon: '←' },
  LOGIN_FAILED:               { color: '#DC2626', bg: '#FEF2F2', icon: '✗' },
  GAP_STATUS_CHANGED:         { color: '#2563EB', bg: '#EFF6FF', icon: '⟳' },
  GAP_ASSIGNED:               { color: '#7C3AED', bg: '#F5F3FF', icon: '→' },
  GAP_NOTES_UPDATED:          { color: '#64748B', bg: '#F8FAFC', icon: '✎' },
  GAP_CREATED:                { color: '#EA580C', bg: '#FFF7ED', icon: '+' },
  GAP_ANALYSIS_RUN:           { color: '#0891B2', bg: '#ECFEFF', icon: '⚡' },
  DOCUMENT_UPLOADED:          { color: '#16A34A', bg: '#F0FDF4', icon: '↑' },
  DOCUMENT_DELETED:           { color: '#DC2626', bg: '#FEF2F2', icon: '✗' },
  DOCUMENT_ANALYZED:          { color: '#0891B2', bg: '#ECFEFF', icon: '⟳' },
  DOCUMENT_GAP_DETECTION:     { color: '#7C3AED', bg: '#F5F3FF', icon: '⚡' },
  POLICY_GENERATED:           { color: '#D97706', bg: '#FFFBEB', icon: '✎' },
  POLICY_SAVED_TO_DOCS:       { color: '#16A34A', bg: '#F0FDF4', icon: '✓' },
  FRAMEWORK_COVERAGE_UPDATED: { color: '#0891B2', bg: '#ECFEFF', icon: '⟳' },
  REPORT_GENERATED:           { color: '#7C3AED', bg: '#F5F3FF', icon: '↓' },
  RISK_RECALCULATED:          { color: '#EA580C', bg: '#FFF7ED', icon: '⟳' },
};

function ActionBadge({ action }: { action: string }) {
  const m = ACTION_META[action] ?? { color: '#64748B', bg: '#F8FAFC', icon: '•' };
  const label = action.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
      background: m.bg, color: m.color, whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 10 }}>{m.icon}</span>
      {label}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const ok = outcome === 'SUCCESS';
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
      background: ok ? '#F0FDF4' : '#FEF2F2',
      color:      ok ? '#16A34A' : '#DC2626',
    }}>
      {ok ? '✓' : '✗'}
    </span>
  );
}

function EntityTypeBadge({ type }: { type: string | null }) {
  if (!type) return <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>;
  const colors: Record<string, string> = {
    Gap: '#EFF6FF', Document: '#F0FDF4', Policy: '#FFFBEB',
    Report: '#F5F3FF', Auth: '#F8FAFC', Risk: '#FFF7ED', System: '#F8FAFC',
  };
  return (
    <span style={{
      fontSize: 11, padding: '1px 7px', borderRadius: 4,
      background: colors[type] ?? '#F8FAFC',
      color: 'var(--text2)', fontWeight: 500,
    }}>
      {type}
    </span>
  );
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return iso; }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AuditTrailPage({ toast }: Props) {
  const [logs,        setLogs]        = useState<AuditLogEntry[]>([]);
  const [stats,       setStats]       = useState<AuditStats | null>(null);
  const [actions,     setActions]     = useState<AuditActionOption[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [totalPages,  setTotalPages]  = useState(0);
  const [totalItems,  setTotalItems]  = useState(0);
  const [expanded,    setExpanded]    = useState<string | null>(null);

  // Filters
  const [page,        setPage]        = useState(0);
  const [userEmail,   setUserEmail]   = useState('');
  const [action,      setAction]      = useState('');
  const [entityType,  setEntityType]  = useState('');
  const [fromDate,    setFromDate]    = useState('');
  const [toDate,      setToDate]      = useState('');

  const PAGE_SIZE = 50;

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const filters: AuditFilters = {
        page: p, size: PAGE_SIZE,
        ...(userEmail  && { userEmail }),
        ...(action     && { action }),
        ...(entityType && { entityType }),
        ...(fromDate   && { from: fromDate + 'T00:00:00' }),
        ...(toDate     && { to:   toDate   + 'T23:59:59' }),
      };
      const data = await auditAPI.getLogs(filters);
      setLogs(data.content);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalElements);
      setPage(p);
    } catch {
      toast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [userEmail, action, entityType, fromDate, toDate, toast]);

  useEffect(() => {
    load(0);
    auditAPI.getStats().then(setStats).catch(() => {});
    auditAPI.getActions().then(setActions).catch(() => {});
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch() { load(0); }
  function handleClear() {
    setUserEmail(''); setAction(''); setEntityType('');
    setFromDate(''); setToDate('');
    setTimeout(() => load(0), 0);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="slide-in">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Audit Trail</h1>
          <p>Immutable log of every user action — who did what, when, and the outcome</p>
        </div>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
          {[
            { label: 'Total Events',      val: stats.totalEvents.toLocaleString(),       color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Last 24 Hours',     val: stats.eventsLast24h.toLocaleString(),     color: '#16A34A', bg: '#F0FDF4' },
            { label: 'Last 7 Days',       val: stats.eventsLast7d.toLocaleString(),      color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Last 30 Days',      val: stats.eventsLast30d.toLocaleString(),     color: '#D97706', bg: '#FFFBEB' },
            { label: 'Active Users (7d)', val: stats.activeUsersLast7d.toLocaleString(), color: '#0891B2', bg: '#ECFEFF' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="card section-gap" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto auto', gap: 10, alignItems: 'end' }}>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Email</label>
            <input
              type="text" value={userEmail} onChange={e => setUserEmail(e.target.value)}
              placeholder="user@example.com"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</label>
            <select value={action} onChange={e => setAction(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}>
              <option value="">All Actions</option>
              {actions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entity Type</label>
            <select value={entityType} onChange={e => setEntityType(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}>
              <option value="">All Types</option>
              {['Gap','Document','Policy','Report','Auth','Risk','System'].map(t =>
                <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }} />
          </div>

          <button onClick={handleSearch} className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icons.Search style={{ width: 13, height: 13 }} /> Search
          </button>

          <button onClick={handleClear} className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: 13 }}>
            Clear
          </button>
        </div>
      </div>

      {/* Results table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="card-title">
            Audit Events
            {!loading && <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--text3)', marginLeft: 8 }}>
              {totalItems.toLocaleString()} total
            </span>}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 0}
                onClick={() => load(page - 1)}>← Prev</button>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1}
                onClick={() => load(page + 1)}>Next →</button>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)' }}>
            Loading audit logs…
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)' }}>
            No audit events found for the selected filters.
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 160 }}>Timestamp</th>
                  <th style={{ width: 140 }}>User</th>
                  <th style={{ width: 200 }}>Action</th>
                  <th style={{ width: 90 }}>Entity</th>
                  <th>Description</th>
                  <th style={{ width: 60 }}>Result</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {logs.map(entry => (
                  <React.Fragment key={entry.id}>
                    <tr
                      style={{ cursor: entry.oldValue || entry.newValue || entry.errorMessage ? 'pointer' : 'default',
                               background: expanded === entry.id ? 'var(--surface2)' : undefined }}
                      onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                    >
                      {/* Timestamp */}
                      <td style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                        {formatDateTime(entry.createdAt)}
                      </td>

                      {/* User */}
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                          {entry.userName || '—'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                          {entry.userEmail || 'system'}
                        </div>
                      </td>

                      {/* Action badge */}
                      <td><ActionBadge action={entry.action} /></td>

                      {/* Entity type */}
                      <td><EntityTypeBadge type={entry.entityType} /></td>

                      {/* Description */}
                      <td>
                        <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>
                          {entry.description || '—'}
                        </div>
                        {entry.entityName && entry.entityName !== entry.description && (
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                            {entry.entityName}
                          </div>
                        )}
                      </td>

                      {/* Outcome */}
                      <td style={{ textAlign: 'center' }}>
                        <OutcomeBadge outcome={entry.outcome} />
                      </td>

                      {/* Expand chevron */}
                      <td style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
                        {(entry.oldValue || entry.newValue || entry.errorMessage || entry.ipAddress)
                          ? (expanded === entry.id ? '▲' : '▼')
                          : ''}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expanded === entry.id && (
                      <tr>
                        <td colSpan={7} style={{ padding: '0 0 2px 0', background: 'var(--surface2)' }}>
                          <div style={{ padding: '10px 16px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            {entry.oldValue && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>Previous Value</div>
                                <div style={{ fontSize: 12, color: '#DC2626', fontFamily: 'var(--mono)', background: '#FEF2F2', padding: '2px 8px', borderRadius: 4 }}>{entry.oldValue}</div>
                              </div>
                            )}
                            {entry.newValue && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>New Value</div>
                                <div style={{ fontSize: 12, color: '#16A34A', fontFamily: 'var(--mono)', background: '#F0FDF4', padding: '2px 8px', borderRadius: 4 }}>{entry.newValue}</div>
                              </div>
                            )}
                            {entry.ipAddress && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>IP Address</div>
                                <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{entry.ipAddress}</div>
                              </div>
                            )}
                            {entry.entityId && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>Entity ID</div>
                                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{entry.entityId}</div>
                              </div>
                            )}
                            {entry.errorMessage && (
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#DC2626', textTransform: 'uppercase', marginBottom: 2 }}>Error</div>
                                <div style={{ fontSize: 12, color: '#DC2626' }}>{entry.errorMessage}</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 0}
              onClick={() => load(0)}>« First</button>
            <button className="btn btn-secondary btn-sm" disabled={page === 0}
              onClick={() => load(page - 1)}>← Prev</button>
            <span style={{ fontSize: 13, color: 'var(--text2)', padding: '4px 8px' }}>
              {page + 1} / {totalPages}
            </span>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1}
              onClick={() => load(page + 1)}>Next →</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1}
              onClick={() => load(totalPages - 1)}>Last »</button>
          </div>
        )}
      </div>
    </div>
  );
}
