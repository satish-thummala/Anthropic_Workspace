// ============================================================
// AFA GROUP — ENTITY CONFIGURATION
// Each entity head sees only their relevant modules + Ask AFA AI
// ============================================================

export interface EntityUser {
  email: string
  password: string
  name: string
  role: string
  avatar: string
  entity: string
  entityShort: string
  entityColor: string   // brand accent for their sidebar
  entityBg: string      // gradient
  scope: 'group' | 'entity'
  navGroups: NavGroup[]
  defaultPath: string
  aiContext: string     // passed to AI to scope answers
}

export interface NavGroup {
  group: string
  items: NavItem[]
}

export interface NavItem {
  path: string
  label: string
  iconKey: string
}

// ── Shared nav items (referenced by iconKey) ─────────────────
export const ALL_NAV: Record<string, { path: string; label: string; iconKey: string }> = {
  executive:  { path: '/executive',        label: 'Executive Overview',   iconKey: 'grid' },
  projects:   { path: '/projects',         label: 'Project Monitoring',   iconKey: 'check' },
  hrfinance:  { path: '/hr-finance',       label: 'HR & Finance',         iconKey: 'users' },
  toll:       { path: '/toll',             label: 'Toll Operations',      iconKey: 'layers' },
  monitoring: { path: '/monitoring',       label: 'Control Tower',        iconKey: 'activity' },
  cyber:      { path: '/cyber',            label: 'Security',             iconKey: 'shield' },
  workflow:   { path: '/workflow',         label: 'Workflow & Approvals', iconKey: 'flow' },
  askafa:     { path: '/ask-afa',          label: 'Ask AFA AI',           iconKey: 'chat' },
  // Entity-specific
  pm_overview:  { path: '/pm/overview',   label: 'Project Overview',      iconKey: 'grid' },
  pm_contracts: { path: '/pm/contracts',  label: 'Contracts & Bids',      iconKey: 'doc' },
  pm_workforce: { path: '/pm/workforce',  label: 'Workforce',             iconKey: 'users' },
  pm_finance:   { path: '/pm/finance',    label: 'Budget & Finance',      iconKey: 'money' },
}

// ── ENTITY USERS ─────────────────────────────────────────────

export const ENTITY_USERS: EntityUser[] = [
  // ── 1. GROUP CEO ─────────────────────────────────────────
  {
    email: 'ceo@afa.group',
    password: 'afa2025',
    name: "Dato' Ahmad Rashid",
    role: 'Group CEO',
    avatar: 'AR',
    entity: 'AFA Group Holdings',
    entityShort: 'GROUP',
    entityColor: '#3b82f6',
    entityBg: 'linear-gradient(135deg, #1e40af, #3b82f6)',
    scope: 'group',
    defaultPath: '/executive',
    aiContext: 'AFA Group Holdings — full group visibility across all entities',
    navGroups: [
      { group: 'COMMAND', items: [
        { path: '/executive',  label: 'Executive Dashboard',  iconKey: 'grid' },
        { path: '/toll',       label: 'Toll Operations',      iconKey: 'layers' },
        { path: '/projects',   label: 'Project Monitoring',   iconKey: 'check' },
        { path: '/hr-finance', label: 'HR & Finance',         iconKey: 'users' },
      ]},
      { group: 'OPERATIONS', items: [
        { path: '/monitoring', label: 'Control Tower',        iconKey: 'activity' },
        { path: '/cyber',      label: 'Security',             iconKey: 'shield' },
        { path: '/workflow',   label: 'Workflow & Approvals', iconKey: 'flow' },
      ]},
      { group: 'INTELLIGENCE', items: [
        { path: '/ask-afa',    label: 'Ask AFA AI',           iconKey: 'chat' },
      ]},
    ],
  },

  // ── 2. AFA PROJECT & MANAGEMENT SERVICES ─────────────────
  {
    email: 'head@afapm.group',
    password: 'afapm2025',
    name: 'Ir. Farouk Zain',
    role: 'Head — Project & Management Services',
    avatar: 'FZ',
    entity: 'AFA Project & Management Services',
    entityShort: 'AFA PM',
    entityColor: '#10b981',
    entityBg: 'linear-gradient(135deg, #065f46, #10b981)',
    scope: 'entity',
    defaultPath: '/entity/overview',
    aiContext: 'AFA Project & Management Services — project delivery, contracts, workforce, budget management',
    navGroups: [
      { group: 'MY ENTITY', items: [
        { path: '/entity/overview',   label: 'Entity Overview',      iconKey: 'grid' },
        { path: '/entity/projects',   label: 'Active Projects',      iconKey: 'check' },
        { path: '/entity/contracts',  label: 'Contracts & Tenders',  iconKey: 'doc' },
        { path: '/entity/workforce',  label: 'Workforce',            iconKey: 'users' },
        { path: '/entity/budget',     label: 'Budget & Finance',     iconKey: 'money' },
      ]},
      { group: 'OPERATIONS', items: [
        { path: '/workflow',          label: 'Approvals & Workflow',  iconKey: 'flow' },
        { path: '/monitoring',        label: 'Alerts & Monitoring',   iconKey: 'activity' },
      ]},
      { group: 'INTELLIGENCE', items: [
        { path: '/ask-afa',           label: 'Ask AFA AI',            iconKey: 'chat' },
      ]},
    ],
  },

  // ── 3. AFA PRIME BERHAD ──────────────────────────────────
  {
    email: 'head@afaprime.group',
    password: 'afaprime2025',
    name: 'Datin Suraya Malik',
    role: 'CEO — AFA PRIME Berhad',
    avatar: 'SM',
    entity: 'AFA PRIME Berhad',
    entityShort: 'PRIME',
    entityColor: '#8b5cf6',
    entityBg: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
    scope: 'entity',
    defaultPath: '/entity/overview',
    aiContext: 'AFA PRIME Berhad — listed entity, compliance, governance, board reporting, investor relations',
    navGroups: [
      { group: 'MY ENTITY', items: [
        { path: '/entity/overview',   label: 'Entity Overview',      iconKey: 'grid' },
        { path: '/entity/compliance', label: 'Compliance & Governance', iconKey: 'shield' },
        { path: '/entity/projects',   label: 'Active Initiatives',   iconKey: 'check' },
        { path: '/entity/budget',     label: 'Budget & Finance',     iconKey: 'money' },
        { path: '/entity/workforce',  label: 'Workforce',            iconKey: 'users' },
      ]},
      { group: 'OPERATIONS', items: [
        { path: '/workflow',          label: 'Approvals & Workflow',  iconKey: 'flow' },
        { path: '/monitoring',        label: 'Alerts & Monitoring',   iconKey: 'activity' },
      ]},
      { group: 'INTELLIGENCE', items: [
        { path: '/ask-afa',           label: 'Ask AFA AI',            iconKey: 'chat' },
      ]},
    ],
  },

  // ── 4. AFA SYSTEMS & SERVICES ────────────────────────────
  {
    email: 'head@afasystems.group',
    password: 'afasys2025',
    name: 'Encik Rizwan Hamid',
    role: 'Head — Systems & Services',
    avatar: 'RH',
    entity: 'AFA Systems & Services',
    entityShort: 'SYSTEMS',
    entityColor: '#06b6d4',
    entityBg: 'linear-gradient(135deg, #164e63, #06b6d4)',
    scope: 'entity',
    defaultPath: '/entity/overview',
    aiContext: 'AFA Systems & Services — toll technology, SCADA, IT infrastructure, system uptime, service delivery',
    navGroups: [
      { group: 'MY ENTITY', items: [
        { path: '/entity/overview',   label: 'Entity Overview',      iconKey: 'grid' },
        { path: '/toll',              label: 'Toll Operations',       iconKey: 'layers' },
        { path: '/entity/projects',   label: 'System Projects',      iconKey: 'check' },
        { path: '/cyber',             label: 'Security & IT',        iconKey: 'shield' },
        { path: '/entity/budget',     label: 'Budget & Finance',     iconKey: 'money' },
      ]},
      { group: 'OPERATIONS', items: [
        { path: '/monitoring',        label: 'Control Tower',         iconKey: 'activity' },
        { path: '/workflow',          label: 'Approvals & Workflow',  iconKey: 'flow' },
      ]},
      { group: 'INTELLIGENCE', items: [
        { path: '/ask-afa',           label: 'Ask AFA AI',            iconKey: 'chat' },
      ]},
    ],
  },

  // ── 5. AFA CONSTRUCTION & ENGINEERING ────────────────────
  {
    email: 'head@afaconstruction.group',
    password: 'afacon2025',
    name: 'Ir. Hazwan Nordin',
    role: 'Director — Construction & Engineering',
    avatar: 'HN',
    entity: 'AFA Construction & Engineering',
    entityShort: 'C&E',
    entityColor: '#f59e0b',
    entityBg: 'linear-gradient(135deg, #78350f, #f59e0b)',
    scope: 'entity',
    defaultPath: '/entity/overview',
    aiContext: 'AFA Construction & Engineering — civil works, site operations, contractor management, project delivery, safety compliance',
    navGroups: [
      { group: 'MY ENTITY', items: [
        { path: '/entity/overview',   label: 'Entity Overview',       iconKey: 'grid' },
        { path: '/entity/projects',   label: 'Site Projects',         iconKey: 'check' },
        { path: '/entity/contracts',  label: 'Contractors',           iconKey: 'doc' },
        { path: '/entity/workforce',  label: 'Site Workforce',        iconKey: 'users' },
        { path: '/entity/budget',     label: 'Budget & Cost',         iconKey: 'money' },
      ]},
      { group: 'OPERATIONS', items: [
        { path: '/monitoring',        label: 'Alerts & Monitoring',   iconKey: 'activity' },
        { path: '/workflow',          label: 'Approvals & Workflow',  iconKey: 'flow' },
      ]},
      { group: 'INTELLIGENCE', items: [
        { path: '/ask-afa',           label: 'Ask AFA AI',            iconKey: 'chat' },
      ]},
    ],
  },

  // ── 6. AFA PROPERTIES ────────────────────────────────────
  {
    email: 'head@afaproperties.group',
    password: 'afaprop2025',
    name: 'Puan Liyana Ismail',
    role: 'Head — Properties',
    avatar: 'LI',
    entity: 'AFA Properties',
    entityShort: 'PROP',
    entityColor: '#ec4899',
    entityBg: 'linear-gradient(135deg, #831843, #ec4899)',
    scope: 'entity',
    defaultPath: '/entity/overview',
    aiContext: 'AFA Properties — property development, sales, leasing, asset management, facility management',
    navGroups: [
      { group: 'MY ENTITY', items: [
        { path: '/entity/overview',   label: 'Entity Overview',       iconKey: 'grid' },
        { path: '/entity/projects',   label: 'Development Projects',  iconKey: 'check' },
        { path: '/entity/budget',     label: 'Revenue & Finance',     iconKey: 'money' },
        { path: '/entity/workforce',  label: 'Workforce',             iconKey: 'users' },
      ]},
      { group: 'OPERATIONS', items: [
        { path: '/monitoring',        label: 'Alerts & Monitoring',   iconKey: 'activity' },
        { path: '/workflow',          label: 'Approvals & Workflow',  iconKey: 'flow' },
      ]},
      { group: 'INTELLIGENCE', items: [
        { path: '/ask-afa',           label: 'Ask AFA AI',            iconKey: 'chat' },
      ]},
    ],
  },

  // ── 7. AFA INFRASTRUCTURE & DEVELOPMENT ──────────────────
  {
    email: 'head@afainfra.group',
    password: 'afainfra2025',
    name: 'Dato Khairul Azmi',
    role: 'Director — Infrastructure & Development',
    avatar: 'KA',
    entity: 'AFA Infrastructure & Development',
    entityShort: 'INFRA',
    entityColor: '#f97316',
    entityBg: 'linear-gradient(135deg, #7c2d12, #f97316)',
    scope: 'entity',
    defaultPath: '/entity/overview',
    aiContext: 'AFA Infrastructure & Development — highway O&M, infrastructure projects, toll network development, concession management',
    navGroups: [
      { group: 'MY ENTITY', items: [
        { path: '/entity/overview',   label: 'Entity Overview',       iconKey: 'grid' },
        { path: '/toll',              label: 'Toll & Traffic',        iconKey: 'layers' },
        { path: '/entity/projects',   label: 'Infrastructure Projects', iconKey: 'check' },
        { path: '/entity/budget',     label: 'Budget & Finance',      iconKey: 'money' },
        { path: '/entity/workforce',  label: 'Field Workforce',       iconKey: 'users' },
      ]},
      { group: 'OPERATIONS', items: [
        { path: '/monitoring',        label: 'Control Tower',         iconKey: 'activity' },
        { path: '/workflow',          label: 'Approvals & Workflow',  iconKey: 'flow' },
      ]},
      { group: 'INTELLIGENCE', items: [
        { path: '/ask-afa',           label: 'Ask AFA AI',            iconKey: 'chat' },
      ]},
    ],
  },

  // ── 8. TERRATECH CONSULTANTS ─────────────────────────────
  {
    email: 'head@terratech.group',
    password: 'terratech2025',
    name: 'Mr. Suresh Pillai',
    role: 'Principal — Terratech Consultants',
    avatar: 'SP',
    entity: 'Terratech Consultants (M)',
    entityShort: 'TERRA',
    entityColor: '#84cc16',
    entityBg: 'linear-gradient(135deg, #365314, #84cc16)',
    scope: 'entity',
    defaultPath: '/entity/overview',
    aiContext: 'Terratech Consultants — engineering consultancy, survey, technical advisory, project monitoring',
    navGroups: [
      { group: 'MY ENTITY', items: [
        { path: '/entity/overview',   label: 'Entity Overview',       iconKey: 'grid' },
        { path: '/entity/projects',   label: 'Consultancy Projects',  iconKey: 'check' },
        { path: '/entity/contracts',  label: 'Engagements',           iconKey: 'doc' },
        { path: '/entity/budget',     label: 'Revenue & Finance',     iconKey: 'money' },
        { path: '/entity/workforce',  label: 'Team',                  iconKey: 'users' },
      ]},
      { group: 'OPERATIONS', items: [
        { path: '/monitoring',        label: 'Alerts & Monitoring',   iconKey: 'activity' },
        { path: '/workflow',          label: 'Approvals & Workflow',  iconKey: 'flow' },
      ]},
      { group: 'INTELLIGENCE', items: [
        { path: '/ask-afa',           label: 'Ask AFA AI',            iconKey: 'chat' },
      ]},
    ],
  },
]

export function findUser(email: string, password: string): EntityUser | null {
  return ENTITY_USERS.find(u => u.email === email && u.password === password) ?? null
}
