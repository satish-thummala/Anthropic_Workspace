export const SEV_COLORS = {
  CRITICAL: '#EF4444',
  HIGH:     '#F97316',
  MEDIUM:   '#F59E0B',
  LOW:      '#22C55E',
};

export const SEV_BG = {
  CRITICAL: '#FEF2F2',
  HIGH:     '#FFF7ED',
  MEDIUM:   '#FFFBEB',
  LOW:      '#F0FDF4',
};

export const STATUS_MAP = {
  open:          { color: '#EF4444', bg: '#FEF2F2', label: 'Open' },
  in_progress:   { color: '#3B82F6', bg: '#EFF6FF', label: 'In Progress' },
  resolved:      { color: '#22C55E', bg: '#F0FDF4', label: 'Resolved' },
  accepted_risk: { color: '#8B5CF6', bg: '#F5F3FF', label: 'Accepted Risk' },
  analyzed:    { color: '#22C55E', bg: '#F0FDF4', label: 'Analyzed' },
  processing:  { color: '#F59E0B', bg: '#FFFBEB', label: 'Processing' },
  queued:      { color: '#94A3B8', bg: '#F8FAFC', label: 'Queued' },
  ready:       { color: '#22C55E', bg: '#F0FDF4', label: 'Ready' },
};
