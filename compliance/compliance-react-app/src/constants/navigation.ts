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
};
