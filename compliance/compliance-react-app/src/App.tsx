import React, { useState } from "react";
import type { PageId } from "./types/compliance.types";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppLayout } from "./components/Layout/AppLayout";
import { LoginPage } from "./components/Auth/LoginPage";
import { SessionWarningModal } from "./components/Auth/SessionWarningModal";
import { Toast } from "./components/shared/Toast";
import { useToast } from "./hooks/useToast";
import { DashboardPage } from "./features/Dashboard/DashboardPage";
import { DocumentsPage } from "./features/Documents/DocumentsPage";
import { FrameworksPage } from "./features/Frameworks/FrameworksPage";
import { GapsPage } from "./features/Gaps/GapsPage";
import { RiskPage } from "./features/Risk/RiskPage";
import { ReportsPage } from "./features/Reports/ReportsPage";
import { AiInsightsPage } from "./features/AiInsights/AiInsightsPage";
import { ComplianceQAPage } from "./features/ComplianceQA/ComplianceQAPage";
import "./styles/globals.css";

const PAGE_MAP: Record<PageId, React.FC<{ toast: any }>> = {
  dashboard: DashboardPage,
  documents: DocumentsPage,
  frameworks: FrameworksPage,
  gaps: GapsPage,
  risk: RiskPage,
  reports: ReportsPage,
  aiInsights: AiInsightsPage,
  complianceQA: ComplianceQAPage,
};

function AuthenticatedApp() {
  const { user, logout, showWarning, warningCountdown, stayLoggedIn } =
    useAuth();
  const [page, setPage] = useState<PageId>("dashboard");
  const { toasts, add: toast, dismiss } = useToast();
  if (!user) return <LoginPage />;
  const PageComponent = PAGE_MAP[page];
  return (
    <>
      <AppLayout page={page} setPage={setPage} user={user} onLogout={logout}>
        <PageComponent toast={toast} />
      </AppLayout>
      <Toast toasts={toasts} dismiss={dismiss} />

      {/* Session timeout warning — rendered at root so it overlays everything */}
      {showWarning && (
        <SessionWarningModal
          countdown={warningCountdown}
          onStay={stayLoggedIn}
          onLogout={() => logout("user")}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
