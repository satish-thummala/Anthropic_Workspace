// ============================================================
// AFA GROUP — ENTITY-SPECIFIC DATA
// Each entity head sees scoped data relevant to their unit
// ============================================================

export interface EntityKPI {
  label: string
  value: string
  trend: number
  status: 'green' | 'yellow' | 'red'
  sub?: string
}

export interface EntityProject {
  id: string
  name: string
  budget: number
  spent: number
  progress: number
  status: 'on-track' | 'delayed' | 'overrun'
  delay: number
  contractor: string
  dueDate: string
  region: string
}

export interface EntityAlert {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  message: string
  time: string
  ack: boolean
}

export interface RevenuePoint {
  month: string
  value: number
  budget: number
}

// ─── ENTITY DATA MAP ───────────────────────────────────────
// Keyed by entity short name (matches entityShort in entityConfig)

export const ENTITY_DATA: Record<string, {
  kpis: EntityKPI[]
  revenueData: RevenuePoint[]
  projects: EntityProject[]
  alerts: EntityAlert[]
  headcount: number
  vacancies: number
  upcomingDeadlines: { item: string; date: string; days: number }[]
  pendingApprovals: number
  complianceScore: number
  tagline: string
}> = {

  // ── AFA PM ────────────────────────────────────────────────
  'AFA PM': {
    tagline: 'Project delivery, contracts & workforce management',
    headcount: 412,
    vacancies: 18,
    complianceScore: 84,
    pendingApprovals: 6,
    kpis: [
      { label: 'Active Projects',     value: '14',        trend: +2,   status: 'green',  sub: 'across regions' },
      { label: 'On-Time Delivery',    value: '71%',       trend: -4,   status: 'yellow', sub: 'target 85%' },
      { label: 'Budget Utilisation',  value: 'RM 38.4M',  trend: +8.2, status: 'yellow', sub: '76% of budget' },
      { label: 'Open Tenders',        value: '5',         trend: +1,   status: 'green',  sub: 'in evaluation' },
      { label: 'Workforce',           value: '412',       trend: +1.2, status: 'green',  sub: 'headcount' },
      { label: 'Compliance Score',    value: '84%',       trend: -2,   status: 'yellow', sub: 'target 90%' },
    ],
    revenueData: [
      { month: 'Oct', value: 4.1, budget: 5.0 }, { month: 'Nov', value: 4.8, budget: 5.0 },
      { month: 'Dec', value: 3.9, budget: 5.0 }, { month: 'Jan', value: 5.2, budget: 5.5 },
      { month: 'Feb', value: 5.8, budget: 5.5 }, { month: 'Mar', value: 6.1, budget: 6.0 },
      { month: 'Apr', value: 5.7, budget: 6.0 }, { month: 'May', value: 6.4, budget: 6.5 },
    ],
    projects: [
      { id: 'PM-001', name: 'Highway O&M Oversight — Central', budget: 8.2, spent: 7.1, progress: 82, status: 'on-track', delay: 0, contractor: 'TechBuild Sdn Bhd', dueDate: 'Aug 2025', region: 'Central' },
      { id: 'PM-002', name: 'PLUS Network Audit & Reporting',   budget: 3.4, spent: 3.8, progress: 70, status: 'overrun',  delay: 12, contractor: 'InnovateTech MY', dueDate: 'Jun 2025', region: 'National' },
      { id: 'PM-003', name: 'O&M Performance Framework',        budget: 2.1, spent: 1.4, progress: 55, status: 'delayed',  delay: 8,  contractor: 'Internal',         dueDate: 'Jul 2025', region: 'Central' },
      { id: 'PM-004', name: 'Contractor KPI Monitoring Q2',     budget: 1.8, spent: 0.9, progress: 40, status: 'on-track', delay: 0,  contractor: 'Internal',         dueDate: 'Sep 2025', region: 'National' },
    ],
    alerts: [
      { id: 'A-001', severity: 'high',   category: 'Project',    message: 'PM-002: Budget overrun at 11.8% — CFO review required', time: '08:20', ack: false },
      { id: 'A-002', severity: 'medium', category: 'Compliance', message: 'Contractor KPI submission overdue — Buildright Bhd (14 days)', time: '07:00', ack: false },
      { id: 'A-003', severity: 'medium', category: 'HR',         message: 'Site engineer vacancy aging >45 days — 8 positions', time: '06:00', ack: true },
      { id: 'A-004', severity: 'low',    category: 'Finance',    message: 'Budget reallocation request pending finance approval', time: '05:30', ack: false },
    ],
    upcomingDeadlines: [
      { item: 'CIDB submission — PM-002', date: 'May 10', days: 5 },
      { item: 'Contractor KPI review — Q1', date: 'May 15', days: 10 },
      { item: 'Board progress report', date: 'May 31', days: 26 },
    ],
  },

  // ── PRIME ─────────────────────────────────────────────────
  'PRIME': {
    tagline: 'Listed entity — governance, compliance & board reporting',
    headcount: 148,
    vacancies: 6,
    complianceScore: 91,
    pendingApprovals: 3,
    kpis: [
      { label: 'Compliance Score',    value: '91%',       trend: +2,   status: 'green',  sub: 'target 92%' },
      { label: 'Board Directives',    value: '12',        trend: 0,    status: 'green',  sub: '11 actioned' },
      { label: 'Open Risks',          value: '7',         trend: -1,   status: 'yellow', sub: '1 critical' },
      { label: 'Active Initiatives',  value: '4',         trend: +1,   status: 'green',  sub: 'on-track' },
      { label: 'Workforce',           value: '148',       trend: 0,    status: 'green',  sub: 'headcount' },
      { label: 'Audit Findings',      value: '3',         trend: -2,   status: 'green',  sub: 'open items' },
    ],
    revenueData: [
      { month: 'Oct', value: 2.1, budget: 2.0 }, { month: 'Nov', value: 2.4, budget: 2.2 },
      { month: 'Dec', value: 2.2, budget: 2.2 }, { month: 'Jan', value: 2.6, budget: 2.5 },
      { month: 'Feb', value: 2.9, budget: 2.5 }, { month: 'Mar', value: 3.1, budget: 3.0 },
      { month: 'Apr', value: 2.8, budget: 3.0 }, { month: 'May', value: 3.2, budget: 3.0 },
    ],
    projects: [
      { id: 'PR-001', name: 'HQ Digital Transformation',     budget: 5.2, spent: 3.1, progress: 55, status: 'delayed',  delay: 30, contractor: 'InnovateTech MY',   dueDate: 'May 2025', region: 'Central' },
      { id: 'PR-002', name: 'Compliance Mgmt System',         budget: 2.8, spent: 1.2, progress: 40, status: 'on-track', delay: 0,  contractor: 'RegTech Solutions', dueDate: 'Sep 2025', region: 'Central' },
      { id: 'PR-003', name: 'ESG Reporting Framework',        budget: 1.1, spent: 0.6, progress: 60, status: 'on-track', delay: 0,  contractor: 'Internal',          dueDate: 'Jul 2025', region: 'National' },
      { id: 'PR-004', name: 'Board Portal Implementation',    budget: 0.8, spent: 0.3, progress: 35, status: 'on-track', delay: 0,  contractor: 'DigiBoard Sdn Bhd', dueDate: 'Oct 2025', region: 'Central' },
    ],
    alerts: [
      { id: 'A-001', severity: 'high',   category: 'Compliance', message: 'PDPA review overdue by 30 days — escalation pending', time: '08:00', ack: false },
      { id: 'A-002', severity: 'high',   category: 'Project',    message: 'PR-001 Digital Transformation: 30 days behind schedule', time: '07:30', ack: false },
      { id: 'A-003', severity: 'medium', category: 'Audit',      message: 'Q1 SOX controls — 4 items not evidenced', time: '06:00', ack: true },
      { id: 'A-004', severity: 'low',    category: 'Governance', message: 'Board resolution filing due in 7 days', time: '05:00', ack: false },
    ],
    upcomingDeadlines: [
      { item: 'PDPA Review completion',    date: 'May 8',  days: 3 },
      { item: 'BNM Quarterly Reporting',   date: 'May 15', days: 10 },
      { item: 'Annual DOSH audit sign-off', date: 'May 31', days: 26 },
    ],
  },

  // ── SYSTEMS ───────────────────────────────────────────────
  'SYSTEMS': {
    tagline: 'Toll technology, IT infrastructure & system uptime',
    headcount: 186,
    vacancies: 14,
    complianceScore: 88,
    pendingApprovals: 4,
    kpis: [
      { label: 'System Uptime',        value: '98.7%',     trend: -0.8, status: 'yellow', sub: 'target 99.5%' },
      { label: 'Active System Proj.',  value: '6',         trend: +1,   status: 'green',  sub: 'in delivery' },
      { label: 'Open Incidents',       value: '3',         trend: +1,   status: 'yellow', sub: '1 critical' },
      { label: 'Toll Lanes Monitored', value: '142',       trend: 0,    status: 'green',  sub: '7 plazas' },
      { label: 'Workforce',            value: '186',       trend: -1.2, status: 'yellow', sub: '14 vacancies' },
      { label: 'Patch Compliance',     value: '87%',       trend: -1,   status: 'yellow', sub: 'target 95%' },
    ],
    revenueData: [
      { month: 'Oct', value: 3.1, budget: 3.5 }, { month: 'Nov', value: 3.4, budget: 3.5 },
      { month: 'Dec', value: 2.9, budget: 3.5 }, { month: 'Jan', value: 3.8, budget: 4.0 },
      { month: 'Feb', value: 4.2, budget: 4.0 }, { month: 'Mar', value: 4.6, budget: 4.5 },
      { month: 'Apr', value: 4.1, budget: 4.5 }, { month: 'May', value: 4.9, budget: 5.0 },
    ],
    projects: [
      { id: 'SY-001', name: 'Toll System Upgrade — KL',       budget: 12.5, spent: 14.1, progress: 65, status: 'overrun',  delay: 21, contractor: 'DigiToll Corp',   dueDate: 'Jul 2025', region: 'Central' },
      { id: 'SY-002', name: 'Smart Surveillance Network',      budget: 8.7,  spent: 9.4,  progress: 88, status: 'overrun',  delay: 7,  contractor: 'VisionTech Asia', dueDate: 'Jun 2025', region: 'Central' },
      { id: 'SY-003', name: 'Plaza Pagoh SCADA Replacement',   budget: 2.1,  spent: 0.8,  progress: 30, status: 'on-track', delay: 0,  contractor: 'InfraNet (M)',    dueDate: 'Nov 2025', region: 'South' },
      { id: 'SY-004', name: 'Centralised NOC Setup',           budget: 3.4,  spent: 1.2,  progress: 25, status: 'on-track', delay: 0,  contractor: 'TechBuild',       dueDate: 'Dec 2025', region: 'Central' },
    ],
    alerts: [
      { id: 'A-001', severity: 'critical', category: 'Operations', message: 'Plaza Pagoh: Traffic sensor offline — 14min data gap', time: '08:55', ack: false },
      { id: 'A-002', severity: 'high',     category: 'Project',    message: 'SY-001 Toll Upgrade: Budget 12.8% overrun — review required', time: '08:00', ack: false },
      { id: 'A-003', severity: 'medium',   category: 'Security',   message: 'Brute force attempt detected on Toll Revenue Portal', time: '06:30', ack: true },
      { id: 'A-004', severity: 'medium',   category: 'HR',         message: 'IT & Technical attrition at 8.4% — above 8% threshold', time: '05:00', ack: false },
    ],
    upcomingDeadlines: [
      { item: 'SY-002 Surveillance — UAT sign-off', date: 'May 12', days: 7 },
      { item: 'Patch cycle — all endpoints',        date: 'May 20', days: 15 },
      { item: 'Annual IT security audit',           date: 'Jun 1',  days: 27 },
    ],
  },

  // ── C&E ───────────────────────────────────────────────────
  'C&E': {
    tagline: 'Civil works, site operations & contractor management',
    headcount: 724,
    vacancies: 38,
    complianceScore: 82,
    pendingApprovals: 8,
    kpis: [
      { label: 'Active Site Projects', value: '9',         trend: 0,    status: 'green',  sub: '3 regions' },
      { label: 'On-Time Delivery',     value: '67%',       trend: -6,   status: 'red',    sub: 'target 80%' },
      { label: 'Budget Utilisation',   value: 'RM 92.1M',  trend: +11,  status: 'yellow', sub: '84% of total' },
      { label: 'Safety Incidents',     value: '2',         trend: +2,   status: 'yellow', sub: 'MTD' },
      { label: 'Workforce',            value: '724',       trend: +1.8, status: 'green',  sub: '38 vacancies' },
      { label: 'DOSH Compliance',      value: '82%',       trend: -3,   status: 'yellow', sub: 'target 90%' },
    ],
    revenueData: [
      { month: 'Oct', value: 9.4, budget: 10.0 }, { month: 'Nov', value: 11.2, budget: 11.0 },
      { month: 'Dec', value: 10.8, budget: 11.0 }, { month: 'Jan', value: 12.1, budget: 12.0 },
      { month: 'Feb', value: 13.4, budget: 13.0 }, { month: 'Mar', value: 14.2, budget: 14.0 },
      { month: 'Apr', value: 13.8, budget: 14.5 }, { month: 'May', value: 15.1, budget: 15.0 },
    ],
    projects: [
      { id: 'CE-001', name: 'Johor Bahru Access Roads',      budget: 62.1, spent: 19.8, progress: 28, status: 'on-track', delay: 0,  contractor: 'Buildright Bhd',  dueDate: 'Jun 2026', region: 'South' },
      { id: 'CE-002', name: 'Ayer Keroh Interchange',         budget: 31.4, spent: 18.9, progress: 42, status: 'on-track', delay: 0,  contractor: 'Terratech (M)',    dueDate: 'Mar 2026', region: 'South' },
      { id: 'CE-003', name: 'Nilai Expressway Widening',      budget: 24.8, spent: 22.1, progress: 88, status: 'overrun',  delay: 14, contractor: 'MegaConst Group',  dueDate: 'May 2025', region: 'Central' },
      { id: 'CE-004', name: 'Slope Stabilisation — North',    budget: 8.4,  spent: 3.1,  progress: 22, status: 'on-track', delay: 0,  contractor: 'GeoTech Solutions', dueDate: 'Dec 2025', region: 'North' },
    ],
    alerts: [
      { id: 'A-001', severity: 'high',   category: 'Safety',     message: 'DOSH near-miss incident — CE-003 Nilai site, lane 4', time: '07:45', ack: false },
      { id: 'A-002', severity: 'high',   category: 'Project',    message: 'CE-003: Budget overrun 10.9% — director sign-off needed', time: '07:00', ack: false },
      { id: 'A-003', severity: 'medium', category: 'HR',         message: 'Site engineer shortage: 38 vacancies unfilled >30 days', time: '06:00', ack: true },
      { id: 'A-004', severity: 'medium', category: 'Compliance', message: 'CIDB audit submission — CE-002 overdue 5 days', time: '05:00', ack: false },
    ],
    upcomingDeadlines: [
      { item: 'DOSH Safety Audit — CE-003', date: 'May 9',  days: 4 },
      { item: 'CIDB submission — CE-002',   date: 'May 10', days: 5 },
      { item: 'Contractor KPI review — Q1', date: 'May 20', days: 15 },
    ],
  },

  // ── PROP ─────────────────────────────────────────────────
  'PROP': {
    tagline: 'Property development, leasing & asset management',
    headcount: 94,
    vacancies: 5,
    complianceScore: 89,
    pendingApprovals: 4,
    kpis: [
      { label: 'Development Projects', value: '4',        trend: 0,    status: 'green',  sub: '2 active' },
      { label: 'Occupancy Rate',       value: '87%',      trend: +2,   status: 'green',  sub: 'commercial' },
      { label: 'Revenue YTD',          value: 'RM 42.1M', trend: +9.4, status: 'green',  sub: 'vs RM 38M target' },
      { label: 'Pending Sales',        value: '23 units', trend: +4,   status: 'green',  sub: 'Seremban Dev' },
      { label: 'Workforce',            value: '94',       trend: 0,    status: 'green',  sub: 'headcount' },
      { label: 'Compliance Score',     value: '89%',      trend: +1,   status: 'green',  sub: 'target 90%' },
    ],
    revenueData: [
      { month: 'Oct', value: 3.8, budget: 3.5 }, { month: 'Nov', value: 4.2, budget: 4.0 },
      { month: 'Dec', value: 5.1, budget: 4.5 }, { month: 'Jan', value: 4.4, budget: 4.5 },
      { month: 'Feb', value: 4.9, budget: 5.0 }, { month: 'Mar', value: 5.8, budget: 5.5 },
      { month: 'Apr', value: 5.2, budget: 5.5 }, { month: 'May', value: 6.1, budget: 6.0 },
    ],
    projects: [
      { id: 'PP-001', name: 'Seremban Commercial Development', budget: 85.0, spent: 52.3, progress: 58, status: 'delayed',  delay: 14, contractor: 'MegaConst Group', dueDate: 'Dec 2025', region: 'South' },
      { id: 'PP-002', name: 'KL Serviced Apartment Phase 2',   budget: 48.0, spent: 12.4, progress: 20, status: 'on-track', delay: 0,  contractor: 'Buildright Bhd',  dueDate: 'Jun 2026', region: 'Central' },
      { id: 'PP-003', name: 'Facility Upgrade — Commercial',   budget: 3.2,  spent: 2.8,  progress: 82, status: 'on-track', delay: 0,  contractor: 'FacilCo (M)',     dueDate: 'Jun 2025', region: 'Central' },
      { id: 'PP-004', name: 'Asset Tagging & Registry',        budget: 0.8,  spent: 0.3,  progress: 35, status: 'on-track', delay: 0,  contractor: 'Internal',         dueDate: 'Aug 2025', region: 'National' },
    ],
    alerts: [
      { id: 'A-001', severity: 'high',   category: 'Project',    message: 'PP-001 Seremban: 14 days behind — contractor recovery plan needed', time: '08:00', ack: false },
      { id: 'A-002', severity: 'medium', category: 'Finance',    message: 'Sales collection outstanding — 8 units >90 days, RM 1.4M', time: '07:00', ack: false },
      { id: 'A-003', severity: 'low',    category: 'Compliance', message: 'APDL renewal due — 2 properties', time: '06:00', ack: true },
    ],
    upcomingDeadlines: [
      { item: 'PP-001 milestone — structural', date: 'May 15', days: 10 },
      { item: 'APDL renewal — 2 properties',  date: 'May 22', days: 17 },
      { item: 'Q2 board report',              date: 'May 31', days: 26 },
    ],
  },

  // ── INFRA ─────────────────────────────────────────────────
  'INFRA': {
    tagline: 'Highway O&M, toll network & concession management',
    headcount: 1240,
    vacancies: 32,
    complianceScore: 86,
    pendingApprovals: 5,
    kpis: [
      { label: 'Plazas Managed',       value: '7',         trend: 0,    status: 'green',  sub: 'all active' },
      { label: 'Toll Revenue YTD',     value: 'RM 487M',   trend: +5.1, status: 'green',  sub: 'vs RM 463M' },
      { label: 'Infrastructure Proj.', value: '8',         trend: +1,   status: 'green',  sub: '2 delayed' },
      { label: 'O&M SLA Compliance',   value: '74%',       trend: -8,   status: 'red',    sub: 'target 90%' },
      { label: 'Workforce',            value: '1,240',     trend: +1.8, status: 'green',  sub: 'field & office' },
      { label: 'Asset Condition',      value: '81%',       trend: -2,   status: 'yellow', sub: 'rated good+' },
    ],
    revenueData: [
      { month: 'Oct', value: 38.2, budget: 37.0 }, { month: 'Nov', value: 39.8, budget: 38.0 },
      { month: 'Dec', value: 37.6, budget: 39.0 }, { month: 'Jan', value: 41.2, budget: 40.0 },
      { month: 'Feb', value: 40.5, budget: 41.0 }, { month: 'Mar', value: 44.2, budget: 43.0 },
      { month: 'Apr', value: 42.9, budget: 43.0 }, { month: 'May', value: 46.1, budget: 45.0 },
    ],
    projects: [
      { id: 'IN-001', name: 'PLUS Highway O&M Phase 3',    budget: 48.2, spent: 41.8, progress: 78, status: 'on-track', delay: 0,  contractor: 'TechBuild Sdn Bhd', dueDate: 'Aug 2025', region: 'Central' },
      { id: 'IN-002', name: 'Johor Bahru Access Roads',     budget: 62.1, spent: 19.8, progress: 28, status: 'on-track', delay: 0,  contractor: 'Buildright Bhd',    dueDate: 'Jun 2026', region: 'South' },
      { id: 'IN-003', name: 'Ayer Keroh Interchange',       budget: 31.4, spent: 18.9, progress: 42, status: 'on-track', delay: 0,  contractor: 'Terratech (M)',      dueDate: 'Mar 2026', region: 'South' },
      { id: 'IN-004', name: 'Plaza Pagoh Sensor Upgrade',   budget: 2.8,  spent: 0.4,  progress: 12, status: 'delayed',  delay: 10, contractor: 'InfraNet (M)',       dueDate: 'Jun 2025', region: 'South' },
    ],
    alerts: [
      { id: 'A-001', severity: 'critical', category: 'Revenue',    message: 'Plaza Sg. Besi: Revenue 22% below forecast (last 3hrs)', time: '08:42', ack: false },
      { id: 'A-002', severity: 'high',     category: 'Operations', message: 'O&M SLA breach: avg response time 4.2hrs (target 3hrs)', time: '07:00', ack: false },
      { id: 'A-003', severity: 'medium',   category: 'Operations', message: 'Plaza Pagoh: Traffic sensor offline — 14min data gap', time: '08:55', ack: false },
      { id: 'A-004', severity: 'medium',   category: 'HR',         message: 'Field workforce vacancy surge — 32 positions unfilled', time: '05:00', ack: true },
    ],
    upcomingDeadlines: [
      { item: 'IN-004 sensor upgrade — delivery', date: 'May 10', days: 5 },
      { item: 'O&M monthly performance report',   date: 'May 15', days: 10 },
      { item: 'Concession compliance review',     date: 'May 31', days: 26 },
    ],
  },

  // ── TERRA ─────────────────────────────────────────────────
  'TERRA': {
    tagline: 'Engineering consultancy, survey & technical advisory',
    headcount: 68,
    vacancies: 4,
    complianceScore: 93,
    pendingApprovals: 2,
    kpis: [
      { label: 'Active Engagements',   value: '11',        trend: +2,   status: 'green',  sub: 'all entities' },
      { label: 'Deliverables On-Time', value: '91%',       trend: +3,   status: 'green',  sub: 'target 90%' },
      { label: 'Revenue YTD',          value: 'RM 8.4M',   trend: +12,  status: 'green',  sub: 'vs RM 7.5M target' },
      { label: 'Open Proposals',       value: '4',         trend: +1,   status: 'green',  sub: 'in review' },
      { label: 'Team Size',            value: '68',        trend: +2.1, status: 'green',  sub: 'engineers & surveyors' },
      { label: 'Client Satisfaction',  value: '94%',       trend: +1,   status: 'green',  sub: 'last survey' },
    ],
    revenueData: [
      { month: 'Oct', value: 0.8, budget: 0.7 }, { month: 'Nov', value: 0.9, budget: 0.8 },
      { month: 'Dec', value: 1.1, budget: 1.0 }, { month: 'Jan', value: 1.0, budget: 1.0 },
      { month: 'Feb', value: 1.2, budget: 1.1 }, { month: 'Mar', value: 1.4, budget: 1.2 },
      { month: 'Apr', value: 1.3, budget: 1.2 }, { month: 'May', value: 1.5, budget: 1.4 },
    ],
    projects: [
      { id: 'TT-001', name: 'Ayer Keroh Interchange — Technical Advisory', budget: 1.8, spent: 1.4, progress: 72, status: 'on-track', delay: 0, contractor: 'Internal', dueDate: 'Mar 2026', region: 'South' },
      { id: 'TT-002', name: 'JB Access Roads — Survey & Design',           budget: 2.4, spent: 0.8, progress: 28, status: 'on-track', delay: 0, contractor: 'Internal', dueDate: 'Jun 2026', region: 'South' },
      { id: 'TT-003', name: 'Highway Condition Assessment — PLUS',         budget: 0.9, spent: 0.7, progress: 78, status: 'on-track', delay: 0, contractor: 'Internal', dueDate: 'Jun 2025', region: 'National' },
      { id: 'TT-004', name: 'Slope Risk Study — North Region',             budget: 0.6, spent: 0.2, progress: 25, status: 'delayed',  delay: 5, contractor: 'Internal', dueDate: 'Aug 2025', region: 'North' },
    ],
    alerts: [
      { id: 'A-001', severity: 'medium', category: 'Delivery', message: 'TT-004: Delayed 5 days — field survey access issue (North)', time: '07:00', ack: false },
      { id: 'A-002', severity: 'low',    category: 'Finance',  message: 'Invoice collection pending — AFA Construction RM 240K (45 days)', time: '06:00', ack: false },
    ],
    upcomingDeadlines: [
      { item: 'TT-003 final report submission', date: 'May 14', days: 9 },
      { item: 'Professional indemnity renewal', date: 'May 28', days: 23 },
      { item: 'Q2 client satisfaction survey',  date: 'May 31', days: 26 },
    ],
  },
}

// AI responses scoped per entity
export const ENTITY_AI_RESPONSES: Record<string, Record<string, string>> = {
  'AFA PM': {
    'Which projects are delayed?': `**PM-002 and PM-003 are currently behind schedule:**\n\n1. **PM-002 — PLUS Network Audit** · 12 days delayed + budget overrun 11.8% · Contractor: InnovateTech MY\n2. **PM-003 — O&M Performance Framework** · 8 days delayed · Internal team resource gap\n\n> Recommend: Fast-track PM-002 recovery plan. Resource reallocation review for PM-003.`,
    'Which department exceeded budget?': `**PM-002 has exceeded budget by 11.8%:**\nSpent RM 3.8M vs approved RM 3.4M.\nPrimary driver: Additional stakeholder review cycles and scope addition.\n\n> CFO sign-off required for budget revision of RM 400K.`,
    'Show workforce attrition alerts': `**Workforce Status — AFA Project & Management Services:**\n\n- Total headcount: 412\n- Open vacancies: 18 (8 site engineers unfilled >45 days)\n- Attrition rate: 3.2% (within threshold)\n\n> Site engineer shortage is impacting PM-003 delivery timeline.`,
    'Compliance gaps summary': `**Compliance Score: 84%** (target 90%)\n\nGaps:\n- CIDB submission overdue — PM-002\n- Contractor KPI submission — Buildright Bhd (14 days late)\n\n> 2 items need immediate closure to protect score.`,
    'Revenue forecast for next quarter': `**Q3 Revenue Forecast — AFA PM:**\n\n- Q2 Actual: RM 18.4M\n- Q3 Forecast: RM 21.2M (+15.2%)\n\nDriven by: PM-001 final milestone billing + PM-004 new engagement start.\n\nModel confidence: 82%.`,
    'What are the top 3 risks today?': `**Top 3 Risks — AFA PM:**\n\n🔴 RISK-1: PM-002 budget overrun — escalation pending finance\n🟡 RISK-2: Site engineer shortage — 8 vacancies impacting delivery\n🟡 RISK-3: CIDB submission overdue — compliance score at risk`,
    'Which contractors are underperforming?': `**Contractor Performance Alert — AFA PM:**\n\n🔴 **InnovateTech MY** — On-time: 55%, Budget adherence: 72%\nLinked to PM-002 delay and overrun.\n\n> Trigger contract review clause per agreement section 14.2.`,
    'Show toll revenue decline': `This metric is not within AFA PM's scope.\nFor toll revenue data, please refer to AFA Infrastructure or request a group-level report from the Group CEO dashboard.`,
  },
  'PRIME': {
    'Compliance gaps summary': `**Compliance Score: 91%** (target 92%)\n\nOpen gaps:\n- PDPA Review: 30 days overdue — legal team action required\n- SOX Controls: 4 items not evidenced for Q1\n- Board resolution filing: due in 7 days\n\n> Score at risk of dropping to 87% if PDPA not closed this week.`,
    'What are the top 3 risks today?': `**Top 3 Risks — AFA PRIME:**\n\n🔴 RISK-1: PDPA non-compliance — regulatory exposure\n🟡 RISK-2: PR-001 Digital Transformation — 30 days delayed\n🟡 RISK-3: SOX evidence gaps — Q1 audit finding`,
    'Which projects are delayed?': `**PR-001 — HQ Digital Transformation is delayed by 30 days.**\n\nContractor: InnovateTech MY\nProgress: 55% (target 70% by May)\n\n> This is the only delayed initiative. Escalate to Director level.`,
    'Show workforce attrition alerts': `**Workforce — AFA PRIME Berhad:**\n\n- Headcount: 148 · Vacancies: 6\n- Attrition: 2.1% — well within threshold\n\nNo attrition alerts. Team is stable.`,
    'Revenue forecast for next quarter': `**Q3 Revenue Forecast — AFA PRIME:**\n\n- Q2 Actual: RM 7.9M\n- Q3 Forecast: RM 9.2M (+16.4%)\n\nDriven by: Board advisory fee increases + ESG reporting service launch.\n\nModel confidence: 79%.`,
    'Which department exceeded budget?': `No departments have exceeded budget in AFA PRIME.\nPR-001 is 55% spent vs 70% scheduled — within acceptable range.\n\nClosest to threshold: Board secretariat at 91% budget consumed.`,
    'Which contractors are underperforming?': `**InnovateTech MY** is the only external contractor for AFA PRIME.\n\nPerformance: On-time 55% · Budget adherence 72%\nLinked to PR-001 Digital Transformation delay.\n\n> Penalty clause consideration as per contract terms.`,
    'Show toll revenue decline': `Toll operations are not within AFA PRIME Berhad's direct scope.\nPlease refer to the Group CEO dashboard or AFA Infrastructure for toll revenue data.`,
  },
  'SYSTEMS': {
    'Which projects are delayed?': `**2 system projects have delays or overruns:**\n\n1. **SY-001 — Toll System Upgrade KL** · 21 days delayed + 12.8% overrun · Contractor: DigiToll Corp\n2. **SY-002 — Smart Surveillance Network** · 7 days delayed + 8% overrun · Contractor: VisionTech Asia\n\n> Both require director approval for revised budgets.`,
    'What are the top 3 risks today?': `**Top Risks — AFA Systems & Services:**\n\n🔴 RISK-1: Plaza Pagoh sensor offline — revenue data gap risk\n🔴 RISK-2: SY-001 double exposure (delay + overrun)\n🟡 RISK-3: IT attrition 8.4% — 14 vacancies unfilled`,
    'Show toll revenue decline': `**Plaza Sg. Besi Revenue Alert:**\n\nRevenue 22% below forecast for last 3 hours.\nPossible root cause: Plaza Pagoh sensor offline causing data gap.\n\n> Dispatch field team to verify lane and sensor status immediately.`,
    'Compliance gaps summary': `**Compliance — AFA Systems:**\n\nPatch compliance at 87% (target 95%) — 87 endpoints pending.\nSecurity review: Brute force attempt on Toll Revenue Portal — contained.\n\n> Priority: Close patch backlog before month-end audit.`,
    'Show workforce attrition alerts': `**Workforce — AFA Systems:**\n\n- Headcount: 186 · Vacancies: 14\n- IT attrition: 8.4% (above 8% threshold)\n\n🔴 ALERT: Attrition breaching threshold. Urgent hiring required for NOC and field support roles.`,
    'Revenue forecast for next quarter': `**Q3 Revenue Forecast — AFA Systems:**\n\n- Q2 Actual: RM 13.1M\n- Q3 Forecast: RM 15.8M (+20.6%)\n\nAssumptions: SY-002 delivery, new toll maintenance contracts signed.\n\nModel confidence: 77%.`,
    'Which department exceeded budget?': `**Toll Revenue Systems** exceeded budget by 12.8% (SY-001).\n\nAdditional cost RM 1.6M driven by unplanned SCADA downtime recovery.\n\n> Formal budget revision request pending CFO approval.`,
    'Which contractors are underperforming?': `**DigiToll Corp** — Rating: 2.8/5.0\n- SY-001: 21 days delayed, 12.8% overrun\n- On-time: 55% · Budget: 72%\n\n> Trigger penalty clause review. Consider alternative vendor for SY-003.`,
  },
  'C&E': {
    'Which projects are delayed?': `**CE-003 — Nilai Expressway Widening** is the critical concern:\n\n- Progress: 88% but 14 days behind milestone\n- Budget overrun: 10.9% (RM 2.3M over)\n- Contractor: MegaConst Group\n\nCE-004 is also tracking late on survey submission by 3 days.\n\n> Mobilise site manager review for CE-003 immediately.`,
    'What are the top 3 risks today?': `**Top Risks — AFA Construction & Engineering:**\n\n🔴 RISK-1: DOSH near-miss — CE-003 Nilai site (safety compliance)\n🔴 RISK-2: CE-003 overrun 10.9% — budget revision required\n🟡 RISK-3: Site workforce shortage — 38 vacancies`,
    'Show workforce attrition alerts': `**Workforce — AFA Construction & Engineering:**\n\n- Headcount: 724 · Vacancies: 38 (largest across group)\n- Attrition: 6.1% — monitoring required\n- Site engineer shortage impacting CE-001 and CE-004\n\n> Mass hiring campaign recommended for Q3.`,
    'Compliance gaps summary': `**DOSH Compliance: 82%** (target 90%)\n\nGaps:\n- DOSH near-miss report — CE-003 (must file within 24hrs)\n- CIDB submission overdue — CE-002 (5 days)\n- Safety toolbox records — CE-004 (2 weeks missing)\n\n> Immediate action needed on DOSH report.`,
    'Which contractors are underperforming?': `**MegaConst Group** — Rating: 3.1/5.0\n- CE-003: 14-day delay + overrun\n- On-time: 62% · Budget: 78%\n\n> Issue formal notice. Recovery plan due within 5 working days.`,
    'Revenue forecast for next quarter': `**Q3 Revenue Forecast — AFA C&E:**\n\n- Q2 Actual: RM 39.1M\n- Q3 Forecast: RM 47.2M (+20.7%)\n\nDriven by: CE-001 and CE-002 milestone billings in Q3.\n\nModel confidence: 80%.`,
    'Which department exceeded budget?': `**CE-003 — Nilai Expressway Widening** is 10.9% over budget.\n\nPrimary drivers: Additional material cost (bitumen price rise) + contractor delay penalties.\n\n> Budget revision of RM 2.3M requires director and CFO approval.`,
    'Show toll revenue decline': `Toll revenue monitoring is not within AFA Construction scope.\nFor toll data, refer to AFA Infrastructure or the Group CEO dashboard.`,
  },
  'PROP': {
    'Which projects are delayed?': `**PP-001 — Seremban Commercial Development** is 14 days behind schedule.\n\nContractor: MegaConst Group · Progress: 58%\nRoot cause: Delayed structural approvals from local authority.\n\n> Expedite LA approval follow-up. Contractor recovery plan review on May 12.`,
    'What are the top 3 risks today?': `**Top Risks — AFA Properties:**\n\n🟡 RISK-1: PP-001 delay — local authority approval bottleneck\n🟡 RISK-2: Sales collection outstanding RM 1.4M (8 units >90 days)\n🟡 RISK-3: APDL renewal overdue — 2 properties`,
    'Revenue forecast for next quarter': `**Q3 Revenue Forecast — AFA Properties:**\n\n- Q2 Actual: RM 15.1M\n- Q3 Forecast: RM 18.4M (+21.9%)\n\nDriven by: PP-001 unit launches + commercial rental renewals.\n\nModel confidence: 83%.`,
    'Compliance gaps summary': `**Compliance Score: 89%** (target 90%)\n\nGaps:\n- APDL renewal: 2 properties overdue\n- Strata title: PP-002 pre-registration pending\n\n> Low risk overall. APDL renewal is the priority action.`,
    'Show workforce attrition alerts': `**Workforce — AFA Properties:**\n\n- Headcount: 94 · Vacancies: 5\n- Attrition: 1.8% — lowest across AFA Group\n\nNo attrition concerns. Team is stable and well-resourced.`,
    'Which contractors are underperforming?': `**MegaConst Group** (PP-001) is underperforming:\n\n- 14 days delayed on Seremban Commercial Dev\n- On-time: 62%\n\n> Contractor notice issued. Recovery plan expected by May 12.`,
    'Which department exceeded budget?': `No departments have exceeded budget in AFA Properties.\nPP-001 is running within approved contingency allocation.\n\nAll projects within budget envelope.`,
    'Show toll revenue decline': `Toll revenue is not within AFA Properties' scope.\nFor toll data, refer to the Group CEO dashboard or AFA Infrastructure.`,
  },
  'INFRA': {
    'Show toll revenue decline': `**Plaza Sg. Besi Revenue Alert:**\n\nRevenue 22% below forecast for last 3 hours (08:00–11:00).\n\n- Expected: RM 94,200\n- Actual: RM 73,500\n- Shortfall: RM 20,700\n\nContributing factors:\n• Plaza Pagoh sensor offline — 14min data gap\n• Jalan Syed Putra incident affecting inflow\n• Lane 4-6 planned maintenance\n\n> Dispatch operations team to Plaza Sg. Besi immediately.`,
    'What are the top 3 risks today?': `**Top Risks — AFA Infrastructure:**\n\n🔴 RISK-1: Plaza Sg. Besi revenue shortfall — 22% below forecast\n🔴 RISK-2: O&M SLA breach — 4.2hrs avg vs 3hr target\n🟡 RISK-3: Plaza Pagoh sensor offline — data continuity risk`,
    'Which projects are delayed?': `**IN-004 — Plaza Pagoh Sensor Upgrade** is 10 days delayed.\n\nContractor: InfraNet (M) · Progress: 12%\nRoot cause: Equipment delivery delay from supplier.\n\n> Expedite with InfraNet. Interim manual reporting until sensor restored.`,
    'Compliance gaps summary': `**O&M Compliance Score: 86%**\n\nGaps:\n- O&M SLA: Response time 4.2hrs vs 3hr target\n- IN-004: Sensor upgrade overdue\n- Field workforce gap: 32 vacancies impacting coverage\n\n> SLA breach is the most urgent operational risk.`,
    'Show workforce attrition alerts': `**Workforce — AFA Infrastructure:**\n\n- Headcount: 1,240 · Vacancies: 32\n- Field attrition: 4.8% — monitoring\n- Overtime: 24.1hrs/week avg (linked to SLA breaches)\n\n> Overtime-delay correlation detected. Workforce expansion needed in South region.`,
    'Revenue forecast for next quarter': `**Q3 Toll Revenue Forecast:**\n\n- Q2 Actual: RM 243M\n- Q3 Forecast: RM 261M (+7.4%)\n\nAssumptions: Plaza Sg. Besi recovery + Pagoh sensor restoration + seasonal volume growth.\n\nModel confidence: 84%.`,
    'Which contractors are underperforming?': `**InfraNet (M)** — Equipment delivery delay causing IN-004 hold.\n\n> Issue delivery notice. Engage backup supplier if delay exceeds 5 working days.`,
    'Which department exceeded budget?': `Toll Operations Systems exceeded budget by 12.8% (RM 1.6M).\n\nDriven by: Unplanned revenue system downtime recovery costs.\n\n> CFO approval pending for budget revision.`,
  },
  'TERRA': {
    'Which projects are delayed?': `**TT-004 — Slope Risk Study (North Region)** is 5 days delayed.\n\nCause: Field survey access restricted — pending land owner permission.\n\n> Expected resolution: May 10. Recovery plan in place.`,
    'What are the top 3 risks today?': `**Top Risks — Terratech Consultants:**\n\n🟡 RISK-1: TT-004 field access delay — North Region\n🟡 RISK-2: Invoice collection outstanding — RM 240K\n🟢 RISK-3: Professional indemnity renewal due May 28\n\nOverall risk profile: LOW. Team performing well.`,
    'Revenue forecast for next quarter': `**Q3 Revenue Forecast — Terratech:**\n\n- Q2 Actual: RM 4.2M\n- Q3 Forecast: RM 5.1M (+21.4%)\n\nDriven by: TT-002 JB design milestone billing + new AFA Properties engagement.\n\nModel confidence: 86%.`,
    'Compliance gaps summary': `**Compliance Score: 93%** — Highest across AFA Group.\n\nMinor items:\n- Professional indemnity: Renewal due May 28\n- TT-004: Field survey log pending for 2 days\n\nNo critical compliance gaps.`,
    'Show workforce attrition alerts': `**Team — Terratech Consultants:**\n\n- Team size: 68 · Vacancies: 4 (senior survey roles)\n- Attrition: 2.1% — well within threshold\n\nNo attrition concerns. Stable and high-performing team.`,
    'Which department exceeded budget?': `No budget overruns in Terratech.\nAll 4 active engagements are within approved budgets.\n\nTT-001 is 78% spent with 72% progress — slight cost efficiency lag to monitor.`,
    'Which contractors are underperforming?': `All Terratech engagements are delivered internally.\nNo external contractor performance concerns at this time.`,
    'Show toll revenue decline': `Toll revenue monitoring is not within Terratech's direct scope.\nTerratech may be engaged for technical advisory on toll infrastructure — refer to AFA Infrastructure for revenue data.`,
  },
}
