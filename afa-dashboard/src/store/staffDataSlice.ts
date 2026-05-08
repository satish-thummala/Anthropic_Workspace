import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// ── Types ─────────────────────────────────────────────────────

export interface TollEntry {
  id: string
  plazaId: string
  plazaName: string
  date: string
  shift: 'morning' | 'afternoon' | 'night'
  vehicleCount: number
  revenue: number
  cashRevenue: number
  cardRevenue: number
  rfidRevenue: number
  incidentNotes: string
  submittedBy: string
  submittedAt: string
  status: 'draft' | 'submitted' | 'approved'
}

export interface ProjectUpdate {
  id: string
  projectId: string
  projectName: string
  date: string
  progressPct: number
  milestoneReached: string
  issuesFlag: 'none' | 'minor' | 'major' | 'critical'
  issueDescription: string
  budgetSpentToDate: number
  workforceOnSite: number
  submittedBy: string
  submittedAt: string
  status: 'draft' | 'submitted' | 'approved'
}

export interface HREntry {
  id: string
  department: string
  date: string
  presentCount: number
  absentCount: number
  onLeaveCount: number
  overtimeHours: number
  newJoiners: number
  resignations: number
  openVacancies: number
  notes: string
  submittedBy: string
  submittedAt: string
  status: 'draft' | 'submitted' | 'approved'
}

export interface FinanceEntry {
  id: string
  department: string
  category: 'expense' | 'revenue' | 'invoice' | 'payment'
  date: string
  description: string
  amount: number
  referenceNo: string
  vendor: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  notes: string
  submittedBy: string
  submittedAt: string
  status: 'draft' | 'submitted' | 'approved'
}

export interface ProcurementEntry {
  id: string
  itemDescription: string
  category: string
  quantity: number
  unitPrice: number
  totalAmount: number
  vendor: string
  requiredDate: string
  justification: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  date: string
  submittedBy: string
  submittedAt: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
}

export interface ComplianceEntry {
  id: string
  complianceType: string
  referenceNo: string
  dueDate: string
  completionDate: string
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  assignedTo: string
  evidenceDescription: string
  remarks: string
  submittedBy: string
  submittedAt: string
}

interface StaffDataState {
  tollEntries: TollEntry[]
  projectUpdates: ProjectUpdate[]
  hrEntries: HREntry[]
  financeEntries: FinanceEntry[]
  procurementEntries: ProcurementEntry[]
  complianceEntries: ComplianceEntry[]
}

// ── Seed data ─────────────────────────────────────────────────

const seedToll: TollEntry[] = [
  { id: 'TE-001', plazaId: 'TP01', plazaName: 'Plaza Sg. Besi', date: '2025-05-05', shift: 'morning', vehicleCount: 14240, revenue: 28480, cashRevenue: 8540, cardRevenue: 11390, rfidRevenue: 8550, incidentNotes: 'Lane 3 minor delay 08:15–08:45', submittedBy: 'Hafiz Rahman', submittedAt: '2025-05-05 14:02', status: 'submitted' },
  { id: 'TE-002', plazaId: 'TP07', plazaName: 'Plaza Skudai',    date: '2025-05-05', shift: 'morning', vehicleCount: 12980, revenue: 25960, cashRevenue: 7780, cardRevenue: 10380, rfidRevenue: 7800, incidentNotes: 'No incidents', submittedBy: 'Nor Azlin', submittedAt: '2025-05-05 13:55', status: 'approved' },
  { id: 'TE-003', plazaId: 'TP02', plazaName: 'Plaza Nilai',      date: '2025-05-05', shift: 'afternoon', vehicleCount: 9870, revenue: 19740, cashRevenue: 5920, cardRevenue: 7900, rfidRevenue: 5920, incidentNotes: '', submittedBy: 'Reza Malik', submittedAt: '2025-05-05 22:10', status: 'submitted' },
]

const seedProjects: ProjectUpdate[] = [
  { id: 'PU-001', projectId: 'PRJ-001', projectName: 'PLUS Highway O&M Phase 3', date: '2025-05-05', progressPct: 78, milestoneReached: 'Resurfacing km 142–158 complete', issuesFlag: 'minor', issueDescription: 'Minor drainage issue at km 154, rectification scheduled', budgetSpentToDate: 41800000, workforceOnSite: 124, submittedBy: 'Ir. Siva Kumar', submittedAt: '2025-05-05 17:30', status: 'submitted' },
  { id: 'PU-002', projectId: 'PRJ-004', projectName: 'Ayer Keroh Interchange', date: '2025-05-05', progressPct: 42, milestoneReached: 'Piling works Zone B completed', issuesFlag: 'none', issueDescription: '', budgetSpentToDate: 18900000, workforceOnSite: 89, submittedBy: 'Ahmad Faiz', submittedAt: '2025-05-05 16:45', status: 'approved' },
  { id: 'PU-003', projectId: 'PRJ-006', projectName: 'Johor Bahru Access Roads', date: '2025-05-04', progressPct: 28, milestoneReached: 'Survey & design phase complete', issuesFlag: 'major', issueDescription: 'Land acquisition delay — 2 parcels pending, affecting Q3 schedule', budgetSpentToDate: 19800000, workforceOnSite: 42, submittedBy: 'Chong Wei Lun', submittedAt: '2025-05-04 18:00', status: 'submitted' },
]

const seedHR: HREntry[] = [
  { id: 'HR-001', department: 'Project Delivery', date: '2025-05-05', presentCount: 118, absentCount: 6, onLeaveCount: 8, overtimeHours: 42, newJoiners: 0, resignations: 1, openVacancies: 24, notes: 'One resignation from site engineer — exit interview scheduled', submittedBy: 'Rashida Mohamad', submittedAt: '2025-05-05 17:00', status: 'submitted' },
  { id: 'HR-002', department: 'Toll Operations',  date: '2025-05-05', presentCount: 94, absentCount: 4, onLeaveCount: 6, overtimeHours: 88, newJoiners: 2, resignations: 0, openVacancies: 18, notes: '2 new collectors onboarded. OT high due to Pagoh sensor issue', submittedBy: 'Nurul Huda', submittedAt: '2025-05-05 18:30', status: 'approved' },
]

const seedFinance: FinanceEntry[] = [
  { id: 'FE-001', department: 'Project Delivery', category: 'expense', date: '2025-05-05', description: 'Bitumen supply — PRJ-001 km 142–158', amount: 184000, referenceNo: 'INV-2025-0841', vendor: 'Global Bitumen Sdn Bhd', approvalStatus: 'approved', notes: '', submittedBy: 'Tan Bee Keat', submittedAt: '2025-05-05 11:20', status: 'submitted' },
  { id: 'FE-002', department: 'IT & Technical',   category: 'invoice', date: '2025-05-05', description: 'CCTV maintenance contract — May', amount: 12400, referenceNo: 'INV-2025-0839', vendor: 'VisionTech Asia', approvalStatus: 'pending', notes: 'Awaiting HOD approval', submittedBy: 'Tan Bee Keat', submittedAt: '2025-05-05 14:45', status: 'submitted' },
  { id: 'FE-003', department: 'O&M',              category: 'expense', date: '2025-05-04', description: 'Emergency road repair materials — Plaza Pagoh', amount: 28600, referenceNo: 'PO-2025-0412', vendor: 'BuildFast Materials', approvalStatus: 'approved', notes: 'Emergency procurement', submittedBy: 'Lim Wei Hong', submittedAt: '2025-05-04 20:15', status: 'approved' },
]

const seedProcurement: ProcurementEntry[] = [
  { id: 'PR-001', itemDescription: 'Reflective road studs — 5,000 units', category: 'Road Materials', quantity: 5000, unitPrice: 4.50, totalAmount: 22500, vendor: 'Saferoad Sdn Bhd', requiredDate: '2025-05-20', justification: 'PRJ-001 Phase 3 night visibility compliance', priority: 'high', date: '2025-05-05', submittedBy: 'Farouk Zainal', submittedAt: '2025-05-05 10:30', status: 'submitted' },
  { id: 'PR-002', itemDescription: 'Safety helmets & vests — 50 sets', category: 'Safety Equipment', quantity: 50, unitPrice: 85, totalAmount: 4250, vendor: 'SafePro Equipment', requiredDate: '2025-05-15', justification: 'New site workers for CE-001', priority: 'medium', date: '2025-05-04', submittedBy: 'Zainab Musa', submittedAt: '2025-05-04 15:00', status: 'approved' },
  { id: 'PR-003', itemDescription: 'Laptop replacement — 3 units', category: 'IT Equipment', quantity: 3, unitPrice: 4200, totalAmount: 12600, vendor: 'TechDirect MY', requiredDate: '2025-05-25', justification: 'Replacement for damaged site laptops — PRJ-003', priority: 'medium', date: '2025-05-05', submittedBy: 'Rizwan Hamid', submittedAt: '2025-05-05 09:15', status: 'draft' },
]

const seedCompliance: ComplianceEntry[] = [
  { id: 'CO-001', complianceType: 'CIDB Submission', referenceNo: 'CIDB-2025-PRJ004', dueDate: '2025-05-10', completionDate: '', status: 'in-progress', assignedTo: 'Ahmad Faiz', evidenceDescription: 'CIDB form C4 prepared, awaiting site engineer signature', remarks: 'Critical — 4 days remaining', submittedBy: 'Compliance Team', submittedAt: '2025-05-05 09:00' },
  { id: 'CO-002', complianceType: 'DOSH Safety Audit', referenceNo: 'DOSH-2025-CE003', dueDate: '2025-05-09', completionDate: '', status: 'pending', assignedTo: 'Site Safety Officer', evidenceDescription: 'Pre-audit checklist 80% complete', remarks: 'Near-miss incident must be documented first', submittedBy: 'Safety Team', submittedAt: '2025-05-05 10:00' },
  { id: 'CO-003', complianceType: 'BNM Quarterly Report', referenceNo: 'BNM-Q1-2025', dueDate: '2025-05-15', completionDate: '2025-05-03', status: 'completed', assignedTo: 'Finance Team', evidenceDescription: 'Report filed via BNM portal, reference TXN-20250503-0041', remarks: '', submittedBy: 'Tan Bee Keat', submittedAt: '2025-05-03 16:30' },
]

// ── Slice ─────────────────────────────────────────────────────

const staffDataSlice = createSlice({
  name: 'staffData',
  initialState: {
    tollEntries:        seedToll,
    projectUpdates:     seedProjects,
    hrEntries:          seedHR,
    financeEntries:     seedFinance,
    procurementEntries: seedProcurement,
    complianceEntries:  seedCompliance,
  } as StaffDataState,
  reducers: {
    // ── TOLL ──────────────────────────────────────────────
    addTollEntry(state, action: PayloadAction<TollEntry>) {
      state.tollEntries.unshift(action.payload)
    },
    updateTollEntry(state, action: PayloadAction<TollEntry>) {
      const i = state.tollEntries.findIndex(e => e.id === action.payload.id)
      if (i !== -1) state.tollEntries[i] = action.payload
    },
    deleteTollEntry(state, action: PayloadAction<string>) {
      state.tollEntries = state.tollEntries.filter(e => e.id !== action.payload)
    },

    // ── PROJECTS ──────────────────────────────────────────
    addProjectUpdate(state, action: PayloadAction<ProjectUpdate>) {
      state.projectUpdates.unshift(action.payload)
    },
    updateProjectUpdate(state, action: PayloadAction<ProjectUpdate>) {
      const i = state.projectUpdates.findIndex(e => e.id === action.payload.id)
      if (i !== -1) state.projectUpdates[i] = action.payload
    },
    deleteProjectUpdate(state, action: PayloadAction<string>) {
      state.projectUpdates = state.projectUpdates.filter(e => e.id !== action.payload)
    },

    // ── HR ────────────────────────────────────────────────
    addHREntry(state, action: PayloadAction<HREntry>) {
      state.hrEntries.unshift(action.payload)
    },
    updateHREntry(state, action: PayloadAction<HREntry>) {
      const i = state.hrEntries.findIndex(e => e.id === action.payload.id)
      if (i !== -1) state.hrEntries[i] = action.payload
    },
    deleteHREntry(state, action: PayloadAction<string>) {
      state.hrEntries = state.hrEntries.filter(e => e.id !== action.payload)
    },

    // ── FINANCE ───────────────────────────────────────────
    addFinanceEntry(state, action: PayloadAction<FinanceEntry>) {
      state.financeEntries.unshift(action.payload)
    },
    updateFinanceEntry(state, action: PayloadAction<FinanceEntry>) {
      const i = state.financeEntries.findIndex(e => e.id === action.payload.id)
      if (i !== -1) state.financeEntries[i] = action.payload
    },
    deleteFinanceEntry(state, action: PayloadAction<string>) {
      state.financeEntries = state.financeEntries.filter(e => e.id !== action.payload)
    },

    // ── PROCUREMENT ───────────────────────────────────────
    addProcurementEntry(state, action: PayloadAction<ProcurementEntry>) {
      state.procurementEntries.unshift(action.payload)
    },
    updateProcurementEntry(state, action: PayloadAction<ProcurementEntry>) {
      const i = state.procurementEntries.findIndex(e => e.id === action.payload.id)
      if (i !== -1) state.procurementEntries[i] = action.payload
    },
    deleteProcurementEntry(state, action: PayloadAction<string>) {
      state.procurementEntries = state.procurementEntries.filter(e => e.id !== action.payload)
    },

    // ── COMPLIANCE ────────────────────────────────────────
    addComplianceEntry(state, action: PayloadAction<ComplianceEntry>) {
      state.complianceEntries.unshift(action.payload)
    },
    updateComplianceEntry(state, action: PayloadAction<ComplianceEntry>) {
      const i = state.complianceEntries.findIndex(e => e.id === action.payload.id)
      if (i !== -1) state.complianceEntries[i] = action.payload
    },
    deleteComplianceEntry(state, action: PayloadAction<string>) {
      state.complianceEntries = state.complianceEntries.filter(e => e.id !== action.payload)
    },
  },
})

export const {
  addTollEntry, updateTollEntry, deleteTollEntry,
  addProjectUpdate, updateProjectUpdate, deleteProjectUpdate,
  addHREntry, updateHREntry, deleteHREntry,
  addFinanceEntry, updateFinanceEntry, deleteFinanceEntry,
  addProcurementEntry, updateProcurementEntry, deleteProcurementEntry,
  addComplianceEntry, updateComplianceEntry, deleteComplianceEntry,
} = staffDataSlice.actions

export default staffDataSlice.reducer
