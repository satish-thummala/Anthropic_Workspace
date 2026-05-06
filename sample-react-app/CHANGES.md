# CHANGES — Enterprise KPI Dashboard

## What Was Built

The original zip only contained `index.html` and `package.json` (no source files).
This release adds the **complete working application**.

---

## Demo Credentials
- **Email:** `admin@enterprise.io`
- **Password:** `password123`

---

## New Files Added

### Core
| File | Purpose |
|------|---------|
| `src/main.tsx` | React entry point, wraps app in Redux Provider |
| `src/App.tsx` | Router setup — public `/login` + protected `/*` routes |
| `src/index.css` | Global styles, Tailwind imports, scrollbar, glass utilities |
| `vite.config.ts` | Vite + React plugin config |
| `tsconfig.json` | TypeScript config |
| `tsconfig.node.json` | TypeScript config for Vite node |
| `postcss.config.js` | PostCSS + Autoprefixer |

### Store (Redux Toolkit)
| File | Purpose |
|------|---------|
| `src/store/index.ts` | Auth slice with `login` / `logout` / `clearError` actions. Demo credentials validated here. |

### Components
| File | Purpose |
|------|---------|
| `src/components/DashboardLayout.tsx` | Shell with collapsible sidebar, top bar, mobile hamburger menu, user avatar, logout button |

### Pages
| File | Purpose |
|------|---------|
| `src/pages/LoginPage.tsx` | Full login form with demo fill button, show/hide password, animated background grid, error state |
| `src/pages/OverviewPage.tsx` | KPI cards, Revenue vs Target area chart, Daily Users bar chart, activity feed, quick stats |
| `src/pages/AnalyticsPage.tsx` | Metric cards, multi-line channel traffic chart, donut pie chart, top pages table |
| `src/pages/ReportsPage.tsx` | Report listing table with status badges, type filters, stat summary cards |
| `src/pages/UsersPage.tsx` | User table with search, avatar initials, role/status badges, edit/delete actions |
| `src/pages/SettingsPage.tsx` | Profile form, notification toggles, security links, save with success feedback |

---

## Key Features

- **Authentication** — Redux-managed login state; unauthenticated users are redirected to `/login`
- **Collapsible Sidebar** — Icon-only mode on desktop; slide-in drawer on mobile
- **Route Protection** — `PrivateRoute` wrapper using `react-router-dom` v6
- **Charts** — Built with `recharts` (AreaChart, LineChart, BarChart, PieChart)
- **Responsive** — Sidebar collapses to hamburger on mobile (`lg:` breakpoint)
- **Dark theme** — Consistent `#080c18` base with glass-morphism cards

---

## How to Run

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` and sign in with the demo credentials above.
