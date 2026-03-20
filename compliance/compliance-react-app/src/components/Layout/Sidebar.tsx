import React from "react";
import type { PageId } from "../../types/compliance.types";
import type { User } from "../../types/compliance.types";
import { Icons } from "../shared/Icons";
import { useGapCount } from "../../contexts/GapCountContext";

interface NavEntry {
  id: PageId;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  section?: string;
  useLiveBadge?: boolean;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const SparkleIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
    <path d="M5 3L5.75 5.25L8 6L5.75 6.75L5 9L4.25 6.75L2 6L4.25 5.25L5 3Z" />
    <path d="M19 15L19.75 17.25L22 18L19.75 18.75L19 21L18.25 18.75L16 18L18.25 17.25L19 15Z" />
  </svg>
);

const ChatIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const PolicyIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <path d="M9 13l1 1 3-3"/>
  </svg>
);

const AuditIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
    <line x1="9" y1="16" x2="12" y2="16"/>
    <circle cx="17" cy="17" r="4"/>
    <line x1="21" y1="21" x2="19" y2="19"/>
  </svg>
);

const IncidentIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const SopIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

const TaskIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <path d="M9 16l2 2 4-4"/>
  </svg>
);

// ── Nav configs ───────────────────────────────────────────────────────────────

const COMPLIANCE_NAV: NavEntry[] = [
  { id: "dashboard",  label: "Dashboard",       Icon: Icons.Dashboard, section: "MAIN" },
  { id: "documents",  label: "Documents",        Icon: Icons.Document },
  { id: "frameworks", label: "Frameworks",       Icon: Icons.Framework },
  { id: "gaps",       label: "Gap Analysis",     Icon: Icons.AlertTriangle, useLiveBadge: true },
  { id: "risk",       label: "Risk Scoring",     Icon: Icons.Risk },
  { id: "reports",    label: "Reports",          Icon: Icons.Report },
  { id: "aiInsights",   label: "AI Insights",    Icon: SparkleIcon,  section: "AI" },
  { id: "complianceQA", label: "Compliance Q&A", Icon: ChatIcon },
  { id: "policyGen",    label: "Policy Generator",Icon: PolicyIcon },
  { id: "auditTrail",   label: "Audit Trail",    Icon: AuditIcon },
  { id: "incidents",    label: "Incidents",      Icon: IncidentIcon },
  { id: "sopManagement",label: "SOP Management", Icon: SopIcon, section: "WORKFORCE" },
];

const EMPLOYEE_NAV: NavEntry[] = [
  { id: "employeePortal", label: "My Tasks",  Icon: TaskIcon, section: "MY PORTAL" },
];

// ── Sidebar component ─────────────────────────────────────────────────────────

interface SidebarProps {
  page:     PageId;
  setPage:  (p: PageId) => void;
  user:     User;
  onLogout: () => void;
}

export function Sidebar({ page, setPage, user, onLogout }: SidebarProps) {
  const { openGapCount } = useGapCount();
  const isEmployee = user.role?.toLowerCase() === 'employee';
  const navItems   = isEmployee ? EMPLOYEE_NAV : COMPLIANCE_NAV;

  // AI section items — purple tint
  const AI_IDS = new Set(['aiInsights', 'complianceQA', 'policyGen', 'auditTrail']);
  // Employee portal items — teal tint
  const EMP_IDS = new Set(['employeePortal']);

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Icons.Shield style={{ width: 18, height: 18, color: "white" }} />
        </div>
        <div>
          <div className="sidebar-logo-text">ComplianceAI</div>
          <div className="sidebar-logo-sub">
            {isEmployee ? 'Employee Portal' : (user.org ?? 'Platform')}
          </div>
        </div>
      </div>

      <div className="sidebar-nav">
        {navItems.map((n, idx) => {
          const badge     = n.useLiveBadge ? openGapCount : undefined;
          const isAI      = AI_IDS.has(n.id);
          const isEmp     = EMP_IDS.has(n.id);
          const navClass  = `nav-item${page === n.id ? " active" : ""}${isAI ? " nav-item-ai" : ""}${isEmp ? " nav-item-emp" : ""}`;

          return (
            <React.Fragment key={n.id}>
              {n.section && (
                <div className="sidebar-section-label"
                  style={{ marginTop: idx === 0 ? 8 : 16 }}>
                  {n.section}
                </div>
              )}
              <button className={navClass} onClick={() => setPage(n.id)}>
                <n.Icon style={{ width: 16, height: 16 }} />
                <span className="nav-item-label">{n.label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="nav-badge">{badge}</span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Employee quick-help banner */}
      {isEmployee && (
        <div style={{ margin: '0 10px 12px', padding: '10px 12px',
          background: 'rgba(16,185,129,0.1)', borderRadius: 8,
          border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399',
            marginBottom: 3 }}>ℹ EMPLOYEE PORTAL</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
            Review and acknowledge the policies assigned to you.
          </div>
        </div>
      )}

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
