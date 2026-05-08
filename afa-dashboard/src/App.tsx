import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './store'
import LoginPage           from './pages/LoginPage'
import DashboardLayout     from './components/DashboardLayout'
import StaffLayout         from './components/StaffLayout'
import ExecutiveDashboard  from './pages/ExecutiveDashboard'
import TollOperations      from './pages/TollOperations'
import ProjectMonitoring   from './pages/ProjectMonitoring'
import HRFinance           from './pages/HRFinance'
import MonitoringCenter    from './pages/MonitoringCenter'
import CyberSecurity       from './pages/CyberSecurity'
import WorkflowPage        from './pages/WorkflowPage'
import AskAFA              from './pages/AskAFA'
import EntityOverview      from './pages/entity/EntityOverview'
import EntityProjects      from './pages/entity/EntityProjects'
import EntityBudget        from './pages/entity/EntityBudget'
import EntityWorkforce     from './pages/entity/EntityWorkforce'
import EntityContracts     from './pages/entity/EntityContracts'
import EntityCompliance    from './pages/entity/EntityCompliance'
import StaffDashboard      from './pages/staff/StaffDashboard'
import StaffTollEntry      from './pages/staff/StaffTollEntry'
import StaffProjectEntry   from './pages/staff/StaffProjectEntry'
import StaffHREntry        from './pages/staff/StaffHREntry'
import StaffFinanceEntry   from './pages/staff/StaffFinanceEntry'
import StaffProcurementEntry from './pages/staff/StaffProcurementEntry'
import StaffComplianceEntry  from './pages/staff/StaffComplianceEntry'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function DefaultRedirect() {
  const user = useSelector((s: RootState) => s.auth.user)
  return <Navigate to={user?.defaultPath ?? '/executive'} replace />
}

function IsStaff({ children }: { children: React.ReactNode }) {
  const user = useSelector((s: RootState) => s.auth.user)
  // Staff users have defaultPath starting with /staff
  if (user?.defaultPath?.startsWith('/staff')) return <>{children}</>
  return <Navigate to={user?.defaultPath ?? '/executive'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* ── Staff routes ───────────────────────────── */}
        <Route path="/staff" element={
          <PrivateRoute>
            <IsStaff>
              <StaffLayout />
            </IsStaff>
          </PrivateRoute>
        }>
          <Route path="dashboard"   element={<StaffDashboard />} />
          <Route path="toll"        element={<StaffTollEntry />} />
          <Route path="projects"    element={<StaffProjectEntry />} />
          <Route path="hr"          element={<StaffHREntry />} />
          <Route path="finance"     element={<StaffFinanceEntry />} />
          <Route path="procurement" element={<StaffProcurementEntry />} />
          <Route path="compliance"  element={<StaffComplianceEntry />} />
        </Route>

        {/* ── Executive / Entity head routes ─────────── */}
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<DefaultRedirect />} />
          <Route path="executive"          element={<ExecutiveDashboard />} />
          <Route path="toll"               element={<TollOperations />} />
          <Route path="projects"           element={<ProjectMonitoring />} />
          <Route path="hr-finance"         element={<HRFinance />} />
          <Route path="monitoring"         element={<MonitoringCenter />} />
          <Route path="cyber"              element={<CyberSecurity />} />
          <Route path="workflow"           element={<WorkflowPage />} />
          <Route path="ask-afa"            element={<AskAFA />} />
          <Route path="entity/overview"    element={<EntityOverview />} />
          <Route path="entity/projects"    element={<EntityProjects />} />
          <Route path="entity/budget"      element={<EntityBudget />} />
          <Route path="entity/workforce"   element={<EntityWorkforce />} />
          <Route path="entity/contracts"   element={<EntityContracts />} />
          <Route path="entity/compliance"  element={<EntityCompliance />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
