import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PageId, User } from '../../types/compliance.types';
import { Icons } from '../shared/Icons';
import { PAGE_TITLES } from '../../constants/navigation';
import { notificationAPI, type ApiNotification } from '../../services/notification-api';

interface TopbarProps {
  page:    PageId;
  user:    User;
  setPage: (p: PageId) => void;   // to navigate on notification click
}

// ── icon per notification type ────────────────────────────────────────────────
const TYPE_META: Record<ApiNotification['type'], { icon: string; color: string; bg: string }> = {
  CRITICAL_GAP: { icon: '🚨', color: '#EF4444', bg: '#FEF2F2' },
  HIGH_GAP:     { icon: '⚠️', color: '#F97316', bg: '#FFF7ED' },
  RISK_CHANGE:  { icon: '📉', color: '#EAB308', bg: '#FEFCE8' },
  FRAMEWORK:    { icon: '🛡️', color: '#3B82F6', bg: '#EFF6FF' },
  SYSTEM:       { icon: '🔔', color: '#8B5CF6', bg: '#F5F3FF' },
};

function timeAgo(isoStr: string): string {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Topbar({ page, user, setPage }: TopbarProps) {
  const [open,         setOpen]         = useState(false);
  const [notifications,setNotifications]= useState<ApiNotification[]>([]);
  const [unread,       setUnread]       = useState(0);
  const [loading,      setLoading]      = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── load count on mount + every 60 s ─────────────────────────────────────
  const refreshCount = useCallback(async () => {
    try {
      const count = await notificationAPI.getUnreadCount();
      setUnread(count);
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, 60_000);
    return () => clearInterval(timer);
  }, [refreshCount]);

  // ── load full list when panel opens ───────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    notificationAPI.getAll()
      .then(setNotifications)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [open]);

  // ── close panel on outside click ─────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── actions ───────────────────────────────────────────────────────────────
  async function handleMarkAllRead() {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  }

  async function handleClickNotif(n: ApiNotification) {
    if (!n.read) {
      await notificationAPI.markRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnread(prev => Math.max(0, prev - 1));
    }
    if (n.linkPage) {
      setPage(n.linkPage as PageId);
      setOpen(false);
    }
  }

  const unreadList = notifications.filter(n => !n.read);
  const readList   = notifications.filter(n =>  n.read);

  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{PAGE_TITLES[page]}</div>
        <div className="topbar-breadcrumb">ComplianceAI / {PAGE_TITLES[page]}</div>
      </div>

      <div className="topbar-actions">

        {/* ── Bell + dropdown panel ────────────────────────────────────── */}
        <div style={{ position: 'relative' }} ref={panelRef}>
          <button
            className="notif-btn"
            onClick={() => setOpen(o => !o)}
            aria-label="Notifications"
          >
            <Icons.Bell />
            {unread > 0 && (
              <div className="notif-badge">{unread > 9 ? '9+' : unread}</div>
            )}
          </button>

          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 380, maxHeight: 520, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 14,
              boxShadow: '0 8px 32px rgba(15,23,42,0.14)',
              display: 'flex', flexDirection: 'column',
              zIndex: 1000, overflow: 'hidden',
              animation: 'slideIn 0.15s ease',
            }}>

              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px 12px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                    Notifications
                  </span>
                  {unread > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 7px',
                      borderRadius: 99, background: '#EF4444', color: 'white',
                    }}>{unread}</span>
                  )}
                </div>
                {unread > 0 && (
                  <button onClick={handleMarkAllRead} style={{
                    fontSize: 11.5, color: 'var(--accent)', fontWeight: 600,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', padding: 0,
                  }}>
                    Mark all read
                  </button>
                )}
              </div>

              {/* Body */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {loading ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '32px 0', color: 'var(--text3)', fontSize: 13,
                  }}>
                    Loading…
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '40px 0', gap: 8,
                  }}>
                    <span style={{ fontSize: 32 }}>🎉</span>
                    <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>
                      You're all caught up!
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Unread section */}
                    {unreadList.length > 0 && (
                      <>
                        <div style={{
                          fontSize: 10, fontWeight: 800, color: 'var(--text3)',
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          padding: '10px 16px 4px',
                        }}>New</div>
                        {unreadList.map(n => (
                          <NotifRow key={n.id} n={n} onClick={() => handleClickNotif(n)} />
                        ))}
                      </>
                    )}

                    {/* Read section */}
                    {readList.length > 0 && (
                      <>
                        <div style={{
                          fontSize: 10, fontWeight: 800, color: 'var(--text3)',
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          padding: '10px 16px 4px',
                          borderTop: unreadList.length > 0 ? '1px solid var(--border)' : 'none',
                        }}>Earlier</div>
                        {readList.map(n => (
                          <NotifRow key={n.id} n={n} onClick={() => handleClickNotif(n)} />
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="divider" />

        {/* User avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
            {user.avatar}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {user.name}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── single notification row ───────────────────────────────────────────────────
function NotifRow({ n, onClick }: { n: ApiNotification; onClick: () => void }) {
  const meta = TYPE_META[n.type];
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', gap: 12, padding: '12px 16px', cursor: 'pointer',
        background: n.read ? 'transparent' : '#F8F7FF',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F5F3FF')}
      onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : '#F8F7FF')}
    >
      {/* Icon bubble */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: meta.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 17, alignSelf: 'flex-start',
      }}>
        {meta.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: n.read ? 500 : 700, color: 'var(--text)',
          lineHeight: 1.3, marginBottom: 3,
          display: 'flex', alignItems: 'flex-start', gap: 6,
        }}>
          <span style={{ flex: 1 }}>{n.title}</span>
          {!n.read && (
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: meta.color, flexShrink: 0, marginTop: 4,
            }} />
          )}
        </div>
        <div style={{
          fontSize: 12, color: 'var(--text2)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: 5,
        }}>
          {n.message}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
            background: meta.bg, color: meta.color,
          }}>
            {n.type.replace('_', ' ')}
          </span>
          <span>·</span>
          <span>{timeAgo(n.createdAt)}</span>
          {n.linkPage && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontWeight: 600 }}>→</span>}
        </div>
      </div>
    </div>
  );
}
