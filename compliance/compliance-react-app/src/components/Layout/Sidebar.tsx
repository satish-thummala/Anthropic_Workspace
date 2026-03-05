import React from 'react';
import type { PageId } from '../../types/compliance.types';
import type { User } from '../../types/compliance.types';
import { Icons } from '../shared/Icons';
import { INITIAL_GAPS } from '../../constants/mockData';
import { PAGE_TITLES } from '../../constants/navigation';

interface NavEntry { id: PageId; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>>; badge?: number; }

const openGaps = INITIAL_GAPS.filter((g) => g.status === 'open').length;

const NAV_ITEMS: NavEntry[] = [
  { id: 'dashboard',  label: 'Dashboard',     Icon: Icons.Dashboard },
  { id: 'documents',  label: 'Documents',     Icon: Icons.Document },
  { id: 'frameworks', label: 'Frameworks',    Icon: Icons.Framework },
  { id: 'gaps',       label: 'Gap Analysis',  Icon: Icons.AlertTriangle, badge: openGaps },
  { id: 'risk',       label: 'Risk Scoring',  Icon: Icons.Risk },
  { id: 'reports',    label: 'Reports',       Icon: Icons.Report },
];

interface SidebarProps {
  page: PageId;
  setPage: (p: PageId) => void;
  user: User;
  onLogout: () => void;
}

export function Sidebar({ page, setPage, user, onLogout }: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Icons.Shield style={{ width: 18, height: 18, color: 'white' }} />
        </div>
        <div>
          <div className="sidebar-logo-text">ComplianceAI</div>
          <div className="sidebar-logo-sub">{user.org}</div>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {NAV_ITEMS.map((n) => (
          <button
            key={n.id}
            className={`nav-item${page === n.id ? ' active' : ''}`}
            onClick={() => setPage(n.id)}
          >
            <n.Icon style={{ width: 16, height: 16 }} />
            <span className="nav-item-label">{n.label}</span>
            {n.badge ? <span className="nav-badge">{n.badge}</span> : null}
          </button>
        ))}
      </div>

      <div className="sidebar-user">
        <div className="avatar">{user.avatar}</div>
        <div>
          <div className="sidebar-user-name">{user.name}</div>
          <div className="sidebar-user-role">{user.role}</div>
        </div>
        <button className="sidebar-logout" onClick={onLogout} title="Logout">
          <Icons.Logout style={{ width: 15, height: 15 }} />
        </button>
      </div>
    </div>
  );
}
