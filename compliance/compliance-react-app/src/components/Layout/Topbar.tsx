import React from 'react';
import type { PageId, User } from '../../types/compliance.types';
import { Icons } from '../shared/Icons';
import { PAGE_TITLES } from '../../constants/navigation';

interface TopbarProps { page: PageId; user: User; }

export function Topbar({ page, user }: TopbarProps) {
  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{PAGE_TITLES[page]}</div>
        <div className="topbar-breadcrumb">ComplianceAI / {PAGE_TITLES[page]}</div>
      </div>
      <div className="topbar-actions">
        <div className="notif-btn">
          <Icons.Bell />
          <div className="notif-badge">3</div>
        </div>
        <div className="divider" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{user.avatar}</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user.name}</span>
        </div>
      </div>
    </div>
  );
}
