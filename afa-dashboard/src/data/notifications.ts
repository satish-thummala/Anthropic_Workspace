// ============================================================
// AFA GROUP — NOTIFICATIONS PER ENTITY
// Each entity head sees personalised, role-relevant notifications
// ============================================================

export interface Notification {
  id: string
  type: 'alert' | 'approval' | 'info' | 'success' | 'warning'
  title: string
  message: string
  time: string
  read: boolean
}

const ENTITY_NOTIFICATIONS: Record<string, Notification[]> = {

  GROUP: [
    { id: 'n1',  type: 'alert',    title: 'Revenue Shortfall',        message: 'Plaza Sg. Besi revenue 22% below forecast for the last 3 hours.',           time: '8:42 AM',  read: false },
    { id: 'n2',  type: 'alert',    title: 'Budget Overrun — PRJ-002', message: 'Toll System Upgrade KL has exceeded budget by 12.8%. Director sign-off needed.', time: '8:00 AM',  read: false },
    { id: 'n3',  type: 'approval', title: 'Approval Pending',         message: 'Bitumen supply order RM 1.2M — awaiting Finance approval (76hrs pending).',   time: '7:15 AM',  read: false },
    { id: 'n4',  type: 'warning',  title: 'SCADA Heartbeat Delay',    message: 'Plaza Pagoh traffic sensor offline — last reading 14 minutes ago.',          time: '6:55 AM',  read: false },
    { id: 'n5',  type: 'warning',  title: 'Attrition Threshold Breach', message: 'IT & Technical department attrition at 8.4%, above the 8% group threshold.', time: '5:00 AM',  read: true  },
    { id: 'n6',  type: 'alert',    title: 'SLA Breach — O&M',         message: 'O&M average response time 4.2hrs, exceeding 3hr SLA target.',                time: '4:12 AM',  read: true  },
    { id: 'n7',  type: 'info',     title: 'Compliance Deadline',       message: 'CIDB submission for PRJ-004 due in 5 days — action required.',               time: 'Yesterday', read: true  },
    { id: 'n8',  type: 'info',     title: 'AI Forecast Updated',       message: 'Q3 group revenue forecast revised to RM 547M (+9.6%). Model confidence 84%.', time: 'Yesterday', read: true  },
  ],

  'AFA PM': [
    { id: 'n1',  type: 'alert',    title: 'PM-002 Budget Overrun',    message: 'PLUS Network Audit project exceeded budget by 11.8%. CFO review required.',   time: '8:20 AM',  read: false },
    { id: 'n2',  type: 'warning',  title: 'Contractor Delay',         message: 'Buildright Bhd KPI submission overdue by 14 days. Escalation recommended.',  time: '7:00 AM',  read: false },
    { id: 'n3',  type: 'approval', title: 'Approval Required',        message: 'Budget reallocation RM 400K — PM-002 recovery plan pending your sign-off.',  time: '6:30 AM',  read: false },
    { id: 'n4',  type: 'warning',  title: 'Vacancy Alert',            message: '8 site engineer positions unfilled for more than 45 days.',                   time: '5:00 AM',  read: true  },
    { id: 'n5',  type: 'info',     title: 'CIDB Submission Due',       message: 'CIDB submission for PM-002 is due in 5 days.',                               time: 'Yesterday', read: true  },
    { id: 'n6',  type: 'success',  title: 'PM-001 Milestone Achieved', message: 'Highway O&M Phase 3 reached 78% completion. On track for August delivery.', time: 'Yesterday', read: true  },
  ],

  PRIME: [
    { id: 'n1',  type: 'alert',    title: 'PDPA Review Overdue',      message: 'Data protection review is 30 days overdue. Regulatory exposure risk.',       time: '8:00 AM',  read: false },
    { id: 'n2',  type: 'alert',    title: 'PR-001 Schedule Delay',    message: 'HQ Digital Transformation is 30 days behind schedule. Escalation needed.',  time: '7:30 AM',  read: false },
    { id: 'n3',  type: 'warning',  title: 'SOX Evidence Gap',         message: 'Q1 audit: 4 control evidence items are missing. Finance team to action.',    time: '6:00 AM',  read: false },
    { id: 'n4',  type: 'approval', title: 'Board Resolution Filing',  message: 'Board resolution filing due in 7 days — secretary to prepare documents.',   time: '5:00 AM',  read: true  },
    { id: 'n5',  type: 'info',     title: 'BNM Reporting Deadline',   message: 'BNM quarterly report due May 15. Finance team notified.',                    time: 'Yesterday', read: true  },
    { id: 'n6',  type: 'success',  title: 'ESG Framework Filed',      message: 'FY2024 ESG report successfully filed. Compliance score updated.',             time: 'Yesterday', read: true  },
  ],

  SYSTEMS: [
    { id: 'n1',  type: 'alert',    title: 'Plaza Pagoh — Sensor Down', message: 'Traffic sensor offline at Plaza Pagoh. Revenue data gap — 14 minutes.',     time: '8:55 AM',  read: false },
    { id: 'n2',  type: 'alert',    title: 'SY-001 Budget Overrun',    message: 'Toll System Upgrade KL: 12.8% overrun. Director approval for revision needed.', time: '8:00 AM', read: false },
    { id: 'n3',  type: 'warning',  title: 'Security Alert',           message: 'Brute force attempt detected on Toll Revenue Portal — access contained.',     time: '6:30 AM',  read: false },
    { id: 'n4',  type: 'warning',  title: 'IT Attrition Alert',       message: 'IT & Technical attrition at 8.4%, above the 8% threshold. 14 open roles.',  time: '5:00 AM',  read: true  },
    { id: 'n5',  type: 'approval', title: 'Patch Cycle Approval',     message: 'Monthly endpoint patch cycle requires your approval before rollout.',          time: '4:30 AM',  read: true  },
    { id: 'n6',  type: 'info',     title: 'SY-002 UAT Milestone',     message: 'Smart Surveillance Network UAT sign-off scheduled for May 12.',               time: 'Yesterday', read: true  },
  ],

  'C&E': [
    { id: 'n1',  type: 'alert',    title: 'DOSH Near-Miss — CE-003',  message: 'Safety near-miss reported at Nilai Expressway site, lane 4. File within 24hrs.', time: '7:45 AM', read: false },
    { id: 'n2',  type: 'alert',    title: 'CE-003 Budget Overrun',    message: 'Nilai Expressway Widening: 10.9% budget overrun. Director sign-off required.', time: '7:00 AM',  read: false },
    { id: 'n3',  type: 'warning',  title: 'Workforce Shortage',       message: '38 site vacancies unfilled — impacting CE-001 and CE-004 timelines.',          time: '6:00 AM',  read: false },
    { id: 'n4',  type: 'warning',  title: 'CIDB Submission Overdue',  message: 'CIDB submission for CE-002 is 5 days overdue. Submit immediately.',            time: '5:00 AM',  read: true  },
    { id: 'n5',  type: 'approval', title: 'Recovery Plan Approval',   message: 'MegaConst Group recovery plan for CE-003 requires your review and approval.',  time: '4:00 AM',  read: true  },
    { id: 'n6',  type: 'info',     title: 'DOSH Audit Due',           message: 'Annual DOSH site audit scheduled for May 20. Preparation checklist available.', time: 'Yesterday', read: true },
  ],

  PROP: [
    { id: 'n1',  type: 'alert',    title: 'PP-001 Schedule Delay',    message: 'Seremban Commercial Dev: 14 days behind. Local authority approval bottleneck.', time: '8:00 AM', read: false },
    { id: 'n2',  type: 'warning',  title: 'Sales Collection Overdue', message: '8 units with outstanding collection >90 days. RM 1.4M pending recovery.',     time: '7:00 AM',  read: false },
    { id: 'n3',  type: 'warning',  title: 'APDL Renewal Due',         message: '2 property APDL licences due for renewal. Deadline: May 22.',                  time: '6:00 AM',  read: false },
    { id: 'n4',  type: 'approval', title: 'Contractor Recovery Plan', message: 'MegaConst Group (PP-001) recovery plan requires your review by May 12.',       time: '5:00 AM',  read: true  },
    { id: 'n5',  type: 'success',  title: 'Occupancy Rate Improved',  message: 'Commercial occupancy now at 87%, up 2% from last quarter. Above target.',      time: 'Yesterday', read: true  },
    { id: 'n6',  type: 'info',     title: 'Q2 Board Report Due',      message: 'Q2 performance board report due May 31. Template available in shared drive.',  time: 'Yesterday', read: true  },
  ],

  INFRA: [
    { id: 'n1',  type: 'alert',    title: 'Revenue Shortfall — Sg. Besi', message: 'Plaza Sg. Besi revenue 22% below forecast (last 3hrs). Dispatch operations team.', time: '8:42 AM', read: false },
    { id: 'n2',  type: 'alert',    title: 'O&M SLA Breach',           message: 'Average O&M response time 4.2hrs — exceeding 3hr SLA. Immediate action needed.', time: '7:00 AM',  read: false },
    { id: 'n3',  type: 'warning',  title: 'Sensor Offline — Pagoh',   message: 'Plaza Pagoh traffic sensor offline — 14-minute data gap in revenue records.', time: '8:55 AM',  read: false },
    { id: 'n4',  type: 'warning',  title: 'Field Workforce Gap',       message: '32 field positions unfilled, contributing to OT surge and SLA breaches.',     time: '5:00 AM',  read: true  },
    { id: 'n5',  type: 'approval', title: 'IN-004 Scope Change',       message: 'Plaza Pagoh sensor upgrade scope revision requires your approval.',             time: '4:30 AM',  read: true  },
    { id: 'n6',  type: 'info',     title: 'Concession Review Due',     message: 'Annual concession compliance review is due May 31.',                           time: 'Yesterday', read: true  },
    { id: 'n7',  type: 'success',  title: 'Toll Revenue YTD',          message: 'Toll revenue YTD at RM 487M, up 5.1% vs same period last year.',              time: 'Yesterday', read: true  },
  ],

  TERRA: [
    { id: 'n1',  type: 'warning',  title: 'TT-004 Access Delay',      message: 'Slope Risk Study (North Region) delayed 5 days — field access restricted.',   time: '7:00 AM',  read: false },
    { id: 'n2',  type: 'warning',  title: 'Invoice Collection',        message: 'AFA Construction invoice RM 240K outstanding for 45 days.',                   time: '6:00 AM',  read: false },
    { id: 'n3',  type: 'info',     title: 'Professional Indemnity',    message: 'Professional indemnity insurance renewal due May 28.',                         time: '5:00 AM',  read: false },
    { id: 'n4',  type: 'success',  title: 'TT-003 Final Report Ready', message: 'Highway Condition Assessment report ready for submission. Due May 14.',        time: 'Yesterday', read: true  },
    { id: 'n5',  type: 'success',  title: 'Client Satisfaction Score', message: 'Latest client survey: 94% satisfaction. Highest across AFA Group entities.', time: 'Yesterday', read: true  },
    { id: 'n6',  type: 'info',     title: 'New Engagement Enquiry',    message: 'AFA Properties submitted scope for technical advisory on PP-002 KL project.',  time: 'Yesterday', read: true  },
  ],
}

export function getNotifications(entityShort: string): Notification[] {
  return ENTITY_NOTIFICATIONS[entityShort] ?? ENTITY_NOTIFICATIONS['GROUP']
}
