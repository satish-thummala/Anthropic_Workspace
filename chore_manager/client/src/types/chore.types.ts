export type RecurrenceType = 'none' | 'weekly' | 'monthly';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday

export interface RecurrenceRule {
  type: RecurrenceType;

  // For weekly recurrence
  daysOfWeek?: DayOfWeek[];      // e.g., [1, 3] for Monday and Wednesday

  // For monthly recurrence
  dayOfMonth?: number;           // 1-31

  // Optional end date for recurrence
  endDate?: string;              // ISO date string (YYYY-MM-DD)
}

export interface Chore {
  id: string;                    // UUID
  title: string;                 // Chore description
  date: string;                  // ISO date string (YYYY-MM-DD)
  assigneeId: string;            // Reference to TeamMember.id
  recurrence: RecurrenceRule;    // Recurrence configuration
  notes?: string;                // Optional notes
  createdAt: string;             // ISO date string
  updatedAt: string;             // ISO date string
}

// For calendar display - represents a specific occurrence of a chore
export interface ChoreInstance {
  id: string;                    // Unique ID for this instance
  title: string;                 // Chore title
  date: string;                  // ISO date string for this instance (YYYY-MM-DD)
  assigneeId: string;            // TeamMember.id
  color: string;                 // Resolved color from team member
  isRecurring: boolean;          // Whether this is from a recurring chore
  baseChoreId: string;           // Reference to the base Chore.id
}
