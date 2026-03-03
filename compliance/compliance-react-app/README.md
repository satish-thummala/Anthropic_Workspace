# Compliance App - React Frontend

AI-powered compliance documentation and workflow automation platform.

## Quick Start

```bash
npm install
npm run dev
```

## Demo Credentials

| Role               | Email                | Password    |
| ------------------ | -------------------- | ----------- |
| Compliance Analyst | admin@techcorp.com   | Admin@123   |
| Risk Manager       | manager@techcorp.com | Manager@123 |

## Project Structure

```
src/
  components/
    Auth/
      LoginPage.tsx           # Login screen with form validation
    Layout/
      AppLayout.tsx           # Root shell (sidebar + topbar + content)
      Sidebar.tsx             # Navigation sidebar
      Topbar.tsx              # Top header bar
    shared/
      Icons.tsx               # All SVG icon components
      Toast.tsx               # Toast notification renderer
  constants/
    mockData.ts               # Seed data (users, frameworks, docs, gaps)
    navigation.ts             # Page ID to title mapping
    statusMaps.ts             # Severity and status colour maps
  contexts/
    AuthContext.tsx           # Auth state + login/logout logic
  features/
    Dashboard/
      DashboardPage.tsx       # Overview stats, charts, priority gaps
    Documents/
      DocumentsPage.tsx       # Upload, analyze, manage documents
    Frameworks/
      FrameworksPage.tsx      # ISO/SOC/GDPR/HIPAA coverage + drill-down
    Gaps/
      GapsPage.tsx            # Gap list with filtering + status management
    Risk/
      RiskPage.tsx            # Risk score gauge, trend chart, factors
    Reports/
      ReportsPage.tsx         # Report generator + download list
  hooks/
    useToast.ts               # Toast queue hook
    useLocalStorage.ts        # Typed localStorage hook
  styles/
    globals.css               # CSS variables + all utility classes
  types/
    compliance.types.ts       # TypeScript interfaces for all domain types
  utils/
    api.ts                    # API client helpers + endpoint constants
    complianceUtils.ts        # coveragePct() and overallScore() helpers
  App.tsx                     # Root component + context providers
  main.tsx                    # React DOM entry point
```
