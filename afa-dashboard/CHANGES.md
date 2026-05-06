# CHANGES — AFA Group Intelligence Platform

## Demo Credentials
- **Email:** `ceo@afa.group`
- **Password:** `afa2025`

---

## How to Run
```bash
npm install
npm run dev
# Open http://localhost:5173
```

---

## What Was Built

A complete enterprise dashboard for **AFA Group Holdings** — modelled on their digital transformation architecture (toll ops, SAP/Oracle ERP, HR, projects, cybersecurity).

### Architecture
- **React 18 + TypeScript + Vite** — same stack as sample app
- **Redux Toolkit** — auth state (login/logout)
- **React Router v6** — 8 protected routes
- **Recharts** — all charts (area, bar, line, composed, pie)
- **Tailwind CSS** — same dark sidebar / white content panel split
- All data in `src/data/mockData.ts` — simulates SAP, Oracle, SCADA, HR, Cyber feeds

---

## Pages (8 total)

| Route | Page | What It Shows |
|-------|------|---------------|
| `/executive` | Executive Dashboard | Group KPIs, revenue trend, integration layer, alerts, pending approvals |
| `/toll` | Toll Operations | Plaza heatmap, hourly traffic, revenue correlation, congestion alerts |
| `/projects` | Project Monitoring | 8 active projects, region stats, contractor scorecard |
| `/hr-finance` | HR & Finance | Dept HR table, overtime vs delay chart, attrition alerts |
| `/monitoring` | Control Tower | Alert feed (with ACK), system uptime, SLA chart, compliance deadlines |
| `/cyber` | Cybersecurity | Risk gauge, threat timeline, incidents, endpoint compliance |
| `/workflow` | Workflow Automation | Procurement flow diagram, active requests tracker, submit form, audit trail |
| `/ask-afa` | Ask AFA AI | Chat interface with pre-defined queries mapped to live mock data |

---

## Key Design Decisions (matching sample app)
- **Dark sidebar** (#0f172a) with blue brand (#1e40af → #2563eb) — replaces indigo from sample
- **Light main area** (#f1f5f9 background, white cards) — same pattern as sample
- **Same component patterns** — NavLink active states, collapsible sidebar, mobile hamburger
- **Live indicator** in sidebar showing connected sources
- Credentials: `ceo@afa.group` / `afa2025`
