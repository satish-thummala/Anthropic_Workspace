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
  useLiveBadge?: boolean; // Flag to use live gap count
}

// Sparkle icon for AI Insights
const SparkleIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...p}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
    <path d="M5 3L5.75 5.25L8 6L5.75 6.75L5 9L4.25 6.75L2 6L4.25 5.25L5 3Z" />
    <path d="M19 15L19.75 17.25L22 18L19.75 18.75L19 21L18.25 18.75L16 18L18.25 17.25L19 15Z" />
  </svg>
);

// Chat icon for Q&A
const ChatIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...p}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// Policy Icon
const PolicyIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
    <path d="M9 13l1 1 3-3"/>
  </svg>
);

const AuditIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
    <line x1="9" y1="16" x2="12" y2="16"/>
    <line x1="9" y1="8" x2="10" y2="8"/>
    <circle cx="17" cy="17" r="4"/>
    <line x1="21" y1="21" x2="19" y2="19"/>
  </svg>
);

const IncidentIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const NAV_ITEMS: NavEntry[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    Icon: Icons.Dashboard,
    section: "MAIN",
  },
  { id: "documents", label: "Documents", Icon: Icons.Document },
  { id: "frameworks", label: "Frameworks", Icon: Icons.Framework },
  {
    id: "gaps",
    label: "Gap Analysis",
    Icon: Icons.AlertTriangle,
    useLiveBadge: true, // This will use real-time gap count
  },
  { id: "risk", label: "Risk Scoring", Icon: Icons.Risk },
  { id: "reports", label: "Reports", Icon: Icons.Report },
  { id: "aiInsights", label: "AI Insights", Icon: SparkleIcon, section: "AI" },
  { id: "complianceQA", label: "Compliance Q&A", Icon: ChatIcon },
  { id: "policyGen",   label: "Policy Generator", Icon: PolicyIcon },
  { id: "auditTrail", label: "Audit Trail",       Icon: AuditIcon },
  { id: "incidents",  label: "Incidents",         Icon: IncidentIcon },
];

interface SidebarProps {
  page: PageId;
  setPage: (p: PageId) => void;
  user: User;
  onLogout: () => void;
}

export function Sidebar({ page, setPage, user, onLogout }: SidebarProps) {
  const { openGapCount } = useGapCount();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Icons.Shield style={{ width: 18, height: 18, color: "white" }} />
        </div>
        <div>
          <div className="sidebar-logo-text">ComplianceAI</div>
          <div className="sidebar-logo-sub">{user.org}</div>
        </div>
      </div>

      <div className="sidebar-nav">
        {NAV_ITEMS.map((n, idx) => {
          // Use live gap count for gaps menu item
          const badge = n.useLiveBadge ? openGapCount : undefined;

          return (
            <React.Fragment key={n.id}>
              {/* Section label when section changes */}
              {n.section && (
                <div
                  className="sidebar-section-label"
                  style={{ marginTop: idx === 0 ? 8 : 16 }}
                >
                  {n.section}
                </div>
              )}
              <button
                className={`nav-item${page === n.id ? " active" : ""}${n.id === "aiInsights" || n.id === "complianceQA" || n.id === "policyGen" || n.id === "auditTrail" ? " nav-item-ai" : ""}`}
                onClick={() => setPage(n.id)}
              >
                <n.Icon style={{ width: 16, height: 16 }} />
                <span className="nav-item-label">{n.label}</span>
                {badge !== undefined && badge > 0 ? (
                  <span className="nav-badge">{badge}</span>
                ) : null}
              </button>
            </React.Fragment>
          );
        })}
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
