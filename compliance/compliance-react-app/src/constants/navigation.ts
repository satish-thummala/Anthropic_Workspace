import type { PageId } from '../types/compliance.types';

export interface NavItem {
  id: PageId;
  label: string;
  badge?: number;
}

export const PAGE_TITLES: Record<PageId, string> = {
  dashboard:  'Overview',
  documents:  'Document Ingestion',
  frameworks: 'Compliance Frameworks',
  gaps:       'Gap Analysis',
  risk:       'Risk Scoring',
  reports:    'Reports & Exports',
  aiInsights:   'AI Insights',
  complianceQA: 'Compliance Q&A',
  policyGen:  'Policy Generator',
  auditTrail: 'Audit Trail',
  incidents:     'Incident Management',
  sopManagement: 'SOP Management',
  employeePortal:'My Compliance Tasks',
};
