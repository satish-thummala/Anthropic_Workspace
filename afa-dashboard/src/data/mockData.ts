// ============================================================
// AFA GROUP — MOCK DATA LAYER
// Simulates: SAP/Oracle ERP, Toll SCADA, HR System,
//            Asset Management, Cybersecurity Stack
// ============================================================

export const GROUP_KPIS = {
  totalRevenue: { value: "RM 1.24B", raw: 1240, trend: +8.3, status: "green" },
  tollRevenue: { value: "RM 487M", raw: 487, trend: +5.1, status: "green" },
  projectsActive: { value: 38, trend: -2, status: "yellow" },
  workforce: { value: "4,821", raw: 4821, trend: +1.2, status: "green" },
  procurementSpend: {
    value: "RM 312M",
    raw: 312,
    trend: +12.4,
    status: "yellow",
  },
  openRisks: { value: 14, trend: +3, status: "red" },
  complianceScore: { value: "87%", raw: 87, trend: -1, status: "yellow" },
  cyberStatus: { value: "GUARDED", trend: 0, status: "yellow" },
};

export const REVENUE_TREND = [
  {
    month: "Jul",
    toll: 38.2,
    construction: 21.4,
    property: 8.1,
    services: 5.3,
  },
  {
    month: "Aug",
    toll: 39.8,
    construction: 24.1,
    property: 7.9,
    services: 5.8,
  },
  {
    month: "Sep",
    toll: 37.6,
    construction: 26.3,
    property: 9.2,
    services: 6.1,
  },
  {
    month: "Oct",
    toll: 41.2,
    construction: 28.7,
    property: 8.7,
    services: 6.4,
  },
  {
    month: "Nov",
    toll: 40.5,
    construction: 31.2,
    property: 10.1,
    services: 6.9,
  },
  {
    month: "Dec",
    toll: 43.1,
    construction: 29.8,
    property: 11.4,
    services: 7.2,
  },
  {
    month: "Jan",
    toll: 39.4,
    construction: 32.1,
    property: 9.8,
    services: 7.5,
  },
  {
    month: "Feb",
    toll: 41.8,
    construction: 34.5,
    property: 10.3,
    services: 7.8,
  },
  {
    month: "Mar",
    toll: 44.2,
    construction: 36.2,
    property: 11.8,
    services: 8.1,
  },
  {
    month: "Apr",
    toll: 42.9,
    construction: 38.4,
    property: 10.9,
    services: 8.4,
  },
  {
    month: "May",
    toll: 46.1,
    construction: 40.1,
    property: 12.3,
    services: 8.7,
  },
];

// Toll Operations Data (SCADA-simulated)
export const TOLL_PLAZAS = [
  {
    id: "TP01",
    name: "Plaza Sg. Besi",
    location: "KL",
    lat: 3.06,
    lng: 101.71,
    volume: 42180,
    revenue: 84.3,
    congestion: "high",
    trend: +4.2,
  },
  {
    id: "TP02",
    name: "Plaza Nilai",
    location: "N9",
    lat: 2.81,
    lng: 101.79,
    volume: 31240,
    revenue: 62.5,
    congestion: "medium",
    trend: +1.8,
  },
  {
    id: "TP03",
    name: "Plaza Seremban",
    location: "N9",
    lat: 2.72,
    lng: 101.94,
    volume: 28910,
    revenue: 57.8,
    congestion: "low",
    trend: -0.5,
  },
  {
    id: "TP04",
    name: "Plaza Ayer Keroh",
    location: "MLK",
    lat: 2.27,
    lng: 102.28,
    volume: 22340,
    revenue: 44.7,
    congestion: "medium",
    trend: +2.1,
  },
  {
    id: "TP05",
    name: "Plaza Pagoh",
    location: "JHR",
    lat: 2.09,
    lng: 102.78,
    volume: 19870,
    revenue: 39.7,
    congestion: "low",
    trend: +0.9,
  },
  {
    id: "TP06",
    name: "Plaza Yong Peng",
    location: "JHR",
    lat: 1.98,
    lng: 103.07,
    volume: 24560,
    revenue: 49.1,
    congestion: "medium",
    trend: +3.4,
  },
  {
    id: "TP07",
    name: "Plaza Skudai",
    location: "JHR",
    lat: 1.52,
    lng: 103.67,
    volume: 38920,
    revenue: 77.8,
    congestion: "high",
    trend: +5.7,
  },
];

export const HOURLY_TRAFFIC = Array.from({ length: 24 }, (_, h) => {
  const base =
    h >= 7 && h <= 9
      ? 3800
      : h >= 17 && h <= 19
        ? 4200
        : h >= 0 && h <= 5
          ? 600
          : 1800;
  const noise = Math.floor(Math.random() * 400 - 200);
  return {
    hour: `${String(h).padStart(2, "0")}:00`,
    vehicles: base + noise,
    revenue: ((base + noise) * 2.1).toFixed(0),
  };
});

export const TRAFFIC_REVENUE_CORR = [
  { plaza: "Sg. Besi", traffic: 42180, revenue: 84.3 },
  { plaza: "Skudai", traffic: 38920, revenue: 77.8 },
  { plaza: "Nilai", traffic: 31240, revenue: 62.5 },
  { plaza: "Seremban", traffic: 28910, revenue: 57.8 },
  { plaza: "Yong Peng", traffic: 24560, revenue: 49.1 },
  { plaza: "Ayer Keroh", traffic: 22340, revenue: 44.7 },
  { plaza: "Pagoh", traffic: 19870, revenue: 39.7 },
];

// Projects Data (Oracle Project Management)
export const PROJECTS = [
  {
    id: "PRJ-001",
    name: "PLUS Highway O&M Phase 3",
    entity: "AFA Infrastructure",
    region: "Central",
    budget: 48.2,
    spent: 41.8,
    progress: 78,
    status: "on-track",
    delay: 0,
    contractor: "TechBuild Sdn Bhd",
    dueDate: "Aug 2025",
  },
  {
    id: "PRJ-002",
    name: "Toll System Upgrade — KL",
    entity: "AFA Systems",
    region: "Central",
    budget: 12.5,
    spent: 14.1,
    progress: 65,
    status: "overrun",
    delay: 21,
    contractor: "DigiToll Corp",
    dueDate: "Jul 2025",
  },
  {
    id: "PRJ-003",
    name: "Seremban Commercial Dev",
    entity: "AFA Properties",
    region: "South",
    budget: 85.0,
    spent: 52.3,
    progress: 58,
    status: "delayed",
    delay: 14,
    contractor: "MegaConst Group",
    dueDate: "Dec 2025",
  },
  {
    id: "PRJ-004",
    name: "Ayer Keroh Interchange",
    entity: "AFA Construction",
    region: "South",
    budget: 31.4,
    spent: 18.9,
    progress: 42,
    status: "on-track",
    delay: 0,
    contractor: "Terratech (M)",
    dueDate: "Mar 2026",
  },
  {
    id: "PRJ-005",
    name: "Smart Surveillance Network",
    entity: "AFA Systems",
    region: "Central",
    budget: 8.7,
    spent: 9.4,
    progress: 88,
    status: "overrun",
    delay: 7,
    contractor: "VisionTech Asia",
    dueDate: "Jun 2025",
  },
  {
    id: "PRJ-006",
    name: "Johor Bahru Access Roads",
    entity: "AFA Infrastructure",
    region: "South",
    budget: 62.1,
    spent: 19.8,
    progress: 28,
    status: "on-track",
    delay: 0,
    contractor: "Buildright Bhd",
    dueDate: "Jun 2026",
  },
  {
    id: "PRJ-007",
    name: "HQ Digital Transformation",
    entity: "AFA PRIME",
    region: "Central",
    budget: 5.2,
    spent: 3.1,
    progress: 55,
    status: "delayed",
    delay: 30,
    contractor: "InnovateTech MY",
    dueDate: "May 2025",
  },
  {
    id: "PRJ-008",
    name: "Compliance Mgmt System",
    entity: "AFA PRIME",
    region: "Central",
    budget: 2.8,
    spent: 1.2,
    progress: 40,
    status: "on-track",
    delay: 0,
    contractor: "RegTech Solutions",
    dueDate: "Sep 2025",
  },
];

export const PROJECT_REGION_STATS = [
  {
    region: "Central",
    projects: 18,
    budget: 142,
    spent: 118,
    onTrack: 12,
    delayed: 4,
    overrun: 2,
  },
  {
    region: "South",
    projects: 14,
    budget: 198,
    spent: 124,
    onTrack: 10,
    delayed: 3,
    overrun: 1,
  },
  {
    region: "North",
    projects: 6,
    budget: 54,
    spent: 32,
    onTrack: 5,
    delayed: 1,
    overrun: 0,
  },
];

export const CONTRACTOR_PERF = [
  { name: "Terratech (M)", projects: 5, onTime: 92, budget: 98, rating: 4.8 },
  { name: "TechBuild", projects: 8, onTime: 81, budget: 95, rating: 4.2 },
  { name: "Buildright Bhd", projects: 6, onTime: 78, budget: 91, rating: 4.0 },
  { name: "MegaConst Group", projects: 4, onTime: 62, budget: 78, rating: 3.1 },
  { name: "DigiToll Corp", projects: 3, onTime: 55, budget: 72, rating: 2.8 },
];

// HR & Finance Data (SAP HCM)
export const DEPT_HR_FINANCE = [
  {
    dept: "Project Delivery",
    headcount: 1240,
    overtime: 18.4,
    vacancies: 24,
    attrition: 3.2,
    hrCost: 28.4,
    projectRevenue: 142.1,
  },
  {
    dept: "Toll Operations",
    headcount: 980,
    overtime: 24.1,
    vacancies: 18,
    attrition: 4.8,
    hrCost: 19.8,
    projectRevenue: 487.3,
  },
  {
    dept: "Finance & Treasury",
    headcount: 210,
    overtime: 8.2,
    vacancies: 5,
    attrition: 2.1,
    hrCost: 8.4,
    projectRevenue: 0,
  },
  {
    dept: "Contract & Procurement",
    headcount: 180,
    overtime: 12.4,
    vacancies: 8,
    attrition: 3.4,
    hrCost: 6.8,
    projectRevenue: 0,
  },
  {
    dept: "O&M",
    headcount: 640,
    overtime: 31.2,
    vacancies: 32,
    attrition: 6.1,
    hrCost: 14.2,
    projectRevenue: 98.4,
  },
  {
    dept: "IT & Technical",
    headcount: 142,
    overtime: 22.1,
    vacancies: 14,
    attrition: 8.4,
    hrCost: 7.8,
    projectRevenue: 0,
  },
  {
    dept: "Human Capital",
    headcount: 88,
    overtime: 6.4,
    vacancies: 3,
    attrition: 1.8,
    hrCost: 3.2,
    projectRevenue: 0,
  },
  {
    dept: "Compliance",
    headcount: 64,
    overtime: 9.8,
    vacancies: 2,
    attrition: 2.4,
    hrCost: 3.8,
    projectRevenue: 0,
  },
];

export const OVERTIME_VS_DELAY = [
  { month: "Sep", overtime: 14.2, delayedProjects: 4 },
  { month: "Oct", overtime: 16.8, delayedProjects: 5 },
  { month: "Nov", overtime: 18.4, delayedProjects: 6 },
  { month: "Dec", overtime: 22.1, delayedProjects: 7 },
  { month: "Jan", overtime: 19.8, delayedProjects: 6 },
  { month: "Feb", overtime: 21.4, delayedProjects: 8 },
  { month: "Mar", overtime: 24.1, delayedProjects: 9 },
  { month: "Apr", overtime: 22.8, delayedProjects: 8 },
];

export const WORKFORCE_AVAILABILITY = [
  { dept: "Project Delivery", available: 88, onLeave: 7, onSite: 94, bench: 5 },
  { dept: "Toll Ops", available: 92, onLeave: 5, onSite: 98, bench: 2 },
  { dept: "O&M", available: 74, onLeave: 12, onSite: 88, bench: 14 },
  { dept: "IT & Tech", available: 81, onLeave: 8, onSite: 72, bench: 19 },
];

// Monitoring / NOC Alerts
export const CRITICAL_ALERTS = [
  {
    id: "ALT-001",
    severity: "critical",
    category: "Revenue",
    message: "Toll Plaza Sg. Besi: Revenue 22% below forecast (last 3 hrs)",
    time: "08:42",
    ack: false,
  },
  {
    id: "ALT-002",
    severity: "high",
    category: "Compliance",
    message:
      "PRJ-002: Budget overrun exceeds 15% threshold — escalation required",
    time: "07:15",
    ack: false,
  },
  {
    id: "ALT-003",
    severity: "high",
    category: "Approval",
    message: "3 procurement approvals pending >72hrs (Finance sign-off)",
    time: "06:30",
    ack: true,
  },
  {
    id: "ALT-004",
    severity: "medium",
    category: "System",
    message: "Toll SCADA heartbeat delayed — Plaza Pagoh (last ping 14min)",
    time: "08:55",
    ack: false,
  },
  {
    id: "ALT-005",
    severity: "medium",
    category: "HR",
    message: "Attrition alert: IT & Technical dept at 8.4% (threshold: 8%)",
    time: "05:00",
    ack: true,
  },
  {
    id: "ALT-006",
    severity: "medium",
    category: "SLA",
    message: "O&M SLA response time: 4.2hrs avg (target: <3hrs)",
    time: "04:12",
    ack: false,
  },
  {
    id: "ALT-007",
    severity: "low",
    category: "Compliance",
    message: "CIDB submission deadline in 5 days — PRJ-004 not submitted",
    time: "08:00",
    ack: true,
  },
  {
    id: "ALT-008",
    severity: "low",
    category: "Finance",
    message: "AP aging: 14 invoices >90 days — RM 2.4M outstanding",
    time: "03:45",
    ack: false,
  },
];

export const SYSTEM_STATUS = [
  {
    system: "Finance",
    status: "online",
    uptime: "99.94%",
    lastSync: "2min ago",
    latency: 142,
  },
  {
    system: "Projects",
    status: "online",
    uptime: "99.81%",
    lastSync: "5min ago",
    latency: 218,
  },
  {
    system: "Toll SCADA",
    status: "warning",
    uptime: "98.12%",
    lastSync: "14min ago",
    latency: 892,
  },
  {
    system: "HR System",
    status: "online",
    uptime: "99.98%",
    lastSync: "1min ago",
    latency: 98,
  },
  {
    system: "Asset Mgmt System",
    status: "online",
    uptime: "99.67%",
    lastSync: "3min ago",
    latency: 187,
  },
  {
    system: "Data Warehouse",
    status: "online",
    uptime: "99.99%",
    lastSync: "30sec ago",
    latency: 54,
  },
  {
    system: "AI Prediction Engine",
    status: "online",
    uptime: "99.45%",
    lastSync: "2min ago",
    latency: 312,
  },
  {
    system: "Cybersecurity Stack",
    status: "online",
    uptime: "100%",
    lastSync: "Live",
    latency: 28,
  },
];

export const PENDING_APPROVALS = [
  {
    id: "WF-0041",
    type: "Procurement",
    description: "Bitumen supply order — RM 1.2M",
    requestedBy: "Abdul K.",
    dept: "Procurement",
    pending: "Finance Approval",
    age: 76,
  },
  {
    id: "WF-0038",
    type: "Procurement",
    description: "CCTV hardware expansion — RM 480K",
    requestedBy: "Lim W.H.",
    dept: "IT & Tech",
    pending: "Director Approval",
    age: 51,
  },
  {
    id: "WF-0035",
    type: "HR",
    description: "New hire batch — 12 engineers",
    requestedBy: "Rashida M.",
    dept: "HR",
    pending: "CEO Approval",
    age: 44,
  },
  {
    id: "WF-0031",
    type: "Finance",
    description: "Q2 budget reallocation — RM 3.1M",
    requestedBy: "Tan B.K.",
    dept: "Finance",
    pending: "CFO Approval",
    age: 38,
  },
];

// Cybersecurity Data
export const CYBER_METRICS = {
  riskScore: 42,
  threatLevel: "GUARDED",
  endpointCompliance: 91.4,
  openIncidents: 3,
  resolvedThisWeek: 18,
  failedLogins24h: 247,
  blockedThreats7d: 1842,
  patchCompliance: 87.2,
};

export const THREAT_TIMELINE = [
  { day: "Mon", threats: 284, blocked: 281, incidents: 1 },
  { day: "Tue", threats: 312, blocked: 309, incidents: 0 },
  { day: "Wed", threats: 198, blocked: 198, incidents: 0 },
  { day: "Thu", threats: 421, blocked: 418, incidents: 2 },
  { day: "Fri", threats: 364, blocked: 361, incidents: 1 },
  { day: "Sat", threats: 142, blocked: 142, incidents: 0 },
  { day: "Sun", threats: 121, blocked: 121, incidents: 0 },
];

export const SECURITY_INCIDENTS = [
  {
    id: "INC-081",
    severity: "high",
    type: "Phishing Attempt",
    asset: "Finance Dept Email",
    time: "2h ago",
    status: "investigating",
  },
  {
    id: "INC-079",
    severity: "medium",
    type: "Brute Force",
    asset: "Toll SCADA Portal",
    time: "6h ago",
    status: "contained",
  },
  {
    id: "INC-078",
    severity: "medium",
    type: "Anomalous Access",
    asset: "SAP Finance Module",
    time: "18h ago",
    status: "resolved",
  },
  {
    id: "INC-076",
    severity: "low",
    type: "Policy Violation",
    asset: "Endpoint WIN-0421",
    time: "1d ago",
    status: "resolved",
  },
];

export const ENDPOINT_STATUS = [
  { category: "Compliant", count: 1241, pct: 91.4 },
  { category: "Patch Pending", count: 87, pct: 6.4 },
  { category: "Non-compliant", count: 29, pct: 2.1 },
];

// Procurement Workflow
export const WORKFLOW_STEPS = [
  {
    id: 1,
    label: "Request Created",
    role: "Requestor",
    dept: "Procurement",
    icon: "📝",
    duration: "< 1 hr",
  },
  {
    id: 2,
    label: "Dept HOD Approval",
    role: "HOD",
    dept: "Business Unit",
    icon: "✅",
    duration: "4 hrs",
  },
  {
    id: 3,
    label: "Finance Review",
    role: "Finance Mgr",
    dept: "Finance & Treasury",
    icon: "💰",
    duration: "8 hrs",
  },
  {
    id: 4,
    label: "Director Sign-off",
    role: "Director",
    dept: "Management",
    icon: "🖊️",
    duration: "4 hrs",
  },
  {
    id: 5,
    label: "Digital PO Issued",
    role: "System",
    dept: "Auto",
    icon: "📄",
    duration: "Instant",
  },
  {
    id: 6,
    label: "Audit Trail Logged",
    role: "System",
    dept: "Auto",
    icon: "🔒",
    duration: "Instant",
  },
];

export const WORKFLOW_ACTIVE = [
  {
    id: "WF-0041",
    item: "Bitumen supply — RM 1.2M",
    amount: 1200000,
    currentStep: 3,
    requestedBy: "Abdul K.",
    requestDate: "2025-05-01",
    urgency: "high",
  },
  {
    id: "WF-0038",
    item: "CCTV hardware — RM 480K",
    amount: 480000,
    currentStep: 4,
    requestedBy: "Lim W.H.",
    requestDate: "2025-05-02",
    urgency: "medium",
  },
  {
    id: "WF-0035",
    item: "Server upgrade — RM 220K",
    amount: 220000,
    currentStep: 2,
    requestedBy: "Ravin S.",
    requestDate: "2025-05-03",
    urgency: "low",
  },
  {
    id: "WF-0033",
    item: "Safety equipment — RM 85K",
    amount: 85000,
    currentStep: 5,
    requestedBy: "Zainab M.",
    requestDate: "2025-04-29",
    urgency: "low",
  },
];

// AI Queries
export const AI_PREDEFINED = [
  { q: "Which projects are delayed?", category: "projects" },
  { q: "Show toll revenue decline", category: "toll" },
  { q: "Which department exceeded budget?", category: "budget" },
  { q: "What are the top 3 risks today?", category: "risk" },
  { q: "Show workforce attrition alerts", category: "hr" },
  { q: "Revenue forecast for next quarter", category: "forecast" },
  { q: "Which contractors are underperforming?", category: "contractors" },
  { q: "Compliance gaps summary", category: "compliance" },
];

export const AI_RESPONSES: Record<string, string> = {
  "Which projects are delayed?": `**3 projects are currently delayed:**\n\n1. **PRJ-003 — Seremban Commercial Dev** · 14 days behind · Contractor: MegaConst Group\n2. **PRJ-007 — HQ Digital Transformation** · 30 days behind · Contractor: InnovateTech MY *(critical)*\n3. **PRJ-002 — Toll System Upgrade KL** · 21 days behind + budget overrun 12.8% · Contractor: DigiToll Corp\n\n> Recommended action: Escalate PRJ-007 to Director level immediately. Schedule recovery plan review for PRJ-002.`,
  "Show toll revenue decline": `**Toll Revenue Alert — Plaza Sg. Besi**\n\nRevenue is tracking **22% below forecast** for the past 3 hours (08:00–11:00).\n\n- Expected: RM 94,200\n- Actual: RM 73,500\n- Shortfall: RM 20,700\n\nPossible causes:\n• SCADA heartbeat delay (14 min lag detected)\n• Incident on Jalan Syed Putra affecting inflow\n• Maintenance at toll lane 4–6 (planned)\n\n> Recommend: Dispatch operations team to verify lane status at Plaza Sg. Besi.`,
  "Which department exceeded budget?": `**2 departments have exceeded budget:**\n\n1. **IT & Technical** — Spent RM 9.4M vs Budget RM 8.7M (**+8.0% overrun**) · Primary driver: CCTV expansion scope change\n2. **Toll Operations (Systems)** — Spent RM 14.1M vs Budget RM 12.5M (**+12.8% overrun**) · Primary driver: Unplanned SCADA downtime recovery\n\n**Monitoring (near threshold):**\n- Procurement: 98% of budget consumed (RM 307M / RM 312M)\n\n> CFO approval required for IT & Technical budget revision.`,
  "What are the top 3 risks today?": `**Top 3 Active Risks (as of today):**\n\n🔴 **RISK-014 — SCADA System Reliability**\nToll SCADA uptime at 98.12%, below 99.5% SLA. Revenue data integrity at risk.\n\n🟡 **RISK-011 — PRJ-002 Schedule + Cost**\nDouble exposure: schedule delay + cost overrun on toll upgrade project.\n\n🟡 **RISK-009 — Talent Attrition: IT & Technical**\n8.4% attrition against 8% threshold. 14 open vacancies unfilled >45 days.\n\n> 14 total open risks. 3 require board-level attention.`,
  "Show workforce attrition alerts": `**Workforce Attrition Summary:**\n\n⚠️ **IT & Technical: 8.4%** (threshold: 8.0%) — ALERT\n⚠️ **Toll Operations: 4.8%** — Monitoring\n\n**Vacancy Aging:**\n- 32 vacancies in O&M unfilled >30 days\n- 14 vacancies in IT & Technical unfilled >45 days\n\n**Overtime Correlation:**\nHigh overtime (24.1 hrs/week avg in Toll Ops) is linked to 3 delayed projects in South region.\n\n> Recommend urgent hiring drive for O&M and IT & Technical departments.`,
  "Revenue forecast for next quarter": `**Q3 FY2025 Revenue Forecast (AI Model)**\n\n| Stream | Q2 Actual | Q3 Forecast | Δ |\n|--------|-----------|-------------|---|\n| Toll | RM 243M | RM 261M | +7.4% |\n| Construction | RM 178M | RM 198M | +11.2% |\n| Property | RM 54M | RM 61M | +13.0% |\n| Services | RM 24M | RM 27M | +12.5% |\n| **Total** | **RM 499M** | **RM 547M** | **+9.6%** |\n\nModel confidence: 84%. Key assumptions: Toll volume growth +5%, PRJ-006 milestone delivery on schedule.`,
  "Which contractors are underperforming?": `**Contractor Performance Alert:**\n\n🔴 **DigiToll Corp** — Rating: 2.8/5.0\n- On-time delivery: 55% (threshold: 75%)\n- Budget adherence: 72% (threshold: 85%)\n- Active projects: 3 (all delayed)\n\n🔴 **MegaConst Group** — Rating: 3.1/5.0\n- On-time delivery: 62%\n- PRJ-003 Seremban delayed 14 days\n\n> Recommend: Trigger contractor review clause. Consider penalty clauses per contract terms.`,
  "Compliance gaps summary": `**Compliance Status — May 2025:**\n\nOverall Score: **87%** (target: 92%)\n\n**Gaps identified:**\n- CIDB submission: PRJ-004 not submitted (deadline in 5 days)\n- DOSH safety audit: 2 sites overdue\n- PDPA data handling: IT review 30 days overdue\n- Finance: 4 SOX controls not evidenced for Q1\n\n**Upcoming deadlines:**\n- May 10: CIDB submission — PRJ-004\n- May 15: BNM quarterly reporting\n- May 31: Annual DOSH audit — all sites\n\n> Compliance score at risk of dropping to 82% if gaps not closed by EOW.`,
};

// Integration data sources
export const INTEGRATION_SOURCES = [
  {
    name: "Finance",
    module: "Finance & Treasury",
    records: 48241,
    lastSync: "2min ago",
    status: "live",
    color: "#0070f3",
  },
  {
    name: "HCM",
    module: "Human Capital Mgmt",
    records: 4821,
    lastSync: "1min ago",
    status: "live",
    color: "#0070f3",
  },
  {
    name: "Projects",
    module: "Project Management",
    records: 38,
    lastSync: "5min ago",
    status: "live",
    color: "#c74634",
  },
  {
    name: "Toll SCADA",
    module: "Traffic & Revenue",
    records: 186420,
    lastSync: "14min ago",
    status: "warning",
    color: "#f59e0b",
  },
  {
    name: "Asset Mgmt",
    module: "Infrastructure Assets",
    records: 12840,
    lastSync: "3min ago",
    status: "live",
    color: "#10b981",
  },
  {
    name: "Data Warehouse",
    module: "Historical Analytics",
    records: 8200000,
    lastSync: "30sec ago",
    status: "live",
    color: "#8b5cf6",
  },
];
