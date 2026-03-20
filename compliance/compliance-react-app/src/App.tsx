import React, { useState } from "react";
import type { PageId } from "./types/compliance.types";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { GapCountProvider } from "./contexts/GapCountContext";
import { AppLayout } from "./components/Layout/AppLayout";
import { LoginPage } from "./components/Auth/LoginPage";
import { SessionWarningModal } from "./components/Auth/SessionWarningModal";
import { Toast } from "./components/shared/Toast";
import { useToast } from "./hooks/useToast";

// ── Compliance staff pages ────────────────────────────────────────────────────
import { DashboardPage }           from "./features/Dashboard/DashboardPage";
import { DocumentsPage }           from "./features/Documents/DocumentsPage";
import { FrameworksPage }          from "./features/Frameworks/FrameworksPage";
import { GapsPage }                from "./features/Gaps/GapsPage";
import { RiskPage }                from "./features/Risk/RiskPage";
import { ReportsPage }             from "./features/Reports/ReportsPage";
import { AiInsightsPage }          from "./features/AiInsights/AiInsightsPage";
import { ComplianceQAPage }        from "./features/ComplianceQA/ComplianceQAPage";
import { PolicyGeneratorPage }     from "./features/Policy/PolicyGeneratorPage";
import { AuditTrailPage }          from "./features/Audit/AuditTrailPage";
import { IncidentManagementPage }  from "./features/Incidents/IncidentManagementPage";
import { SopManagementPage }       from "./features/SopManagement/SopManagementPage";

// ── Employee portal page ──────────────────────────────────────────────────────
import { EmployeePortalPage }      from "./features/EmployeePortal/EmployeePortalPage";

import "./styles/globals.css";

// ── Page maps ─────────────────────────────────────────────────────────────────

const COMPLIANCE_PAGE_MAP: Record<string, React.FC<{ toast: any; user?: any }>> = {
  dashboard:     DashboardPage,
  documents:     DocumentsPage,
  frameworks:    FrameworksPage,
  gaps:          GapsPage,
  risk:          RiskPage,
  reports:       ReportsPage,
  aiInsights:    AiInsightsPage,
  complianceQA:  ComplianceQAPage,
  policyGen:     PolicyGeneratorPage,
  auditTrail:    AuditTrailPage,
  incidents:     IncidentManagementPage,
  sopManagement: SopManagementPage,
};

const EMPLOYEE_PAGE_MAP: Record<string, React.FC<{ toast: any; user?: any }>> = {
  employeePortal: EmployeePortalPage,
};

// ── Authenticated app ─────────────────────────────────────────────────────────

function AuthenticatedApp() {
  const { user, logout, showWarning, warningCountdown, stayLoggedIn } = useAuth();
  const { toasts, add: toast, dismiss } = useToast();

  const isEmployee = user?.role?.toLowerCase() === 'employee';

  // Default landing page differs by role
  const defaultPage: PageId = isEmployee ? 'employeePortal' : 'dashboard';
  const [page, setPage]     = useState<PageId>(defaultPage);

  if (!user) return <LoginPage />;

  // Choose which page map applies
  const pageMap    = isEmployee ? EMPLOYEE_PAGE_MAP : COMPLIANCE_PAGE_MAP;

  // If somehow on a page not in their map, redirect to their default
  const safePage   = pageMap[page] ? page : defaultPage;
  const PageComp   = pageMap[safePage] ?? (() =>
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
      Page not found
    </div>
  );

  function handleSetPage(p: PageId) {
    // Prevent employees from navigating to compliance pages
    if (isEmployee && !EMPLOYEE_PAGE_MAP[p]) return;
    setPage(p);
  }

  return (
    <GapCountProvider>
      <AppLayout page={safePage} setPage={handleSetPage} user={user} onLogout={logout}>
        <PageComp toast={toast} user={user} />
      </AppLayout>
      <Toast toasts={toasts} dismiss={dismiss} />

      {showWarning && (
        <SessionWarningModal
          countdown={warningCountdown}
          onStay={stayLoggedIn}
          onLogout={() => logout("user")}
        />
      )}
    </GapCountProvider>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
