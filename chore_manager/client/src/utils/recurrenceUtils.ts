import type { Chore, ChoreInstance, DayOfWeek } from '../types/chore.types';
import type { TeamMember } from '../types/team.types';
import {
  fromISODateString,
  toISODateString,
  addDaysToDate,
  addMonthsToDate,
  setDayOfMonth,
  isDateAfter,
  isDateBefore
} from './dateUtils';

/**
 * Generate weekly recurring chore instances within a date range
 */
function generateWeeklyInstances(
  chore: Chore,
  startDate: Date,
  endDate: Date,
  color: string
): ChoreInstance[] {
  const instances: ChoreInstance[] = [];
  const { daysOfWeek, endDate: recurEndDate } = chore.recurrence;

  if (!daysOfWeek || daysOfWeek.length === 0) {
    return instances;
  }

  // Start from the chore's initial date
  let currentDate = fromISODateString(chore.date);

  // Make sure we start from the beginning of our range
  if (isDateBefore(currentDate, startDate)) {
    currentDate = new Date(startDate);
  }

  const recurEndDateObj = recurEndDate ? fromISODateString(recurEndDate) : null;

  // Iterate through each day in the range
  while (!isDateAfter(currentDate, endDate)) {
    const dayOfWeek = currentDate.getDay() as DayOfWeek;

    // Check if this day matches the recurrence pattern
    if (daysOfWeek.includes(dayOfWeek)) {
      // Check if we're within the recurrence end date
      if (!recurEndDateObj || !isDateAfter(currentDate, recurEndDateObj)) {
        // Check if we're within our viewing range
        if (!isDateBefore(currentDate, startDate) && !isDateAfter(currentDate, endDate)) {
          instances.push({
            id: `${chore.id}-${toISODateString(currentDate)}`,
            title: chore.title,
            date: toISODateString(currentDate),
            assigneeId: chore.assigneeId,
            color,
            isRecurring: true,
            baseChoreId: chore.id,
          });
        }
      }
    }

    currentDate = addDaysToDate(currentDate, 1);
  }

  return instances;
}

/**
 * Generate monthly recurring chore instances within a date range
 */
function generateMonthlyInstances(
  chore: Chore,
  startDate: Date,
  endDate: Date,
  color: string
): ChoreInstance[] {
  const instances: ChoreInstance[] = [];
  const { dayOfMonth, endDate: recurEndDate } = chore.recurrence;

  if (!dayOfMonth) {
    return instances;
  }

  // Start from the chore's initial date month
  let currentDate = fromISODateString(chore.date);
  currentDate = setDayOfMonth(currentDate, dayOfMonth);

  // If the chore's initial date is after the start date, we need to go back
  if (isDateAfter(currentDate, startDate)) {
    while (isDateAfter(currentDate, startDate)) {
      currentDate = addMonthsToDate(currentDate, -1);
      currentDate = setDayOfMonth(currentDate, dayOfMonth);
    }
  }

  const recurEndDateObj = recurEndDate ? fromISODateString(recurEndDate) : null;

  // Generate instances for each month
  while (!isDateAfter(currentDate, endDate)) {
    // Check if we're within the recurrence end date
    if (!recurEndDateObj || !isDateAfter(currentDate, recurEndDateObj)) {
      // Check if we're within our viewing range
      if (!isDateBefore(currentDate, startDate) && !isDateAfter(currentDate, endDate)) {
        instances.push({
          id: `${chore.id}-${toISODateString(currentDate)}`,
          title: chore.title,
          date: toISODateString(currentDate),
          assigneeId: chore.assigneeId,
          color,
          isRecurring: true,
          baseChoreId: chore.id,
        });
      }
    }

    // Move to next month
    currentDate = addMonthsToDate(currentDate, 1);
    currentDate = setDayOfMonth(currentDate, dayOfMonth);
  }

  return instances;
}

/**
 * Generate chore instances for a date range
 * Handles both one-time and recurring chores
 *
 * @param chores - Array of base chores
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param getMemberById - Function to get team member by ID (for color)
 * @returns Array of ChoreInstance objects for the calendar
 */
export function generateChoreInstances(
  chores: Chore[],
  startDate: Date,
  endDate: Date,
  getMemberById: (id: string) => TeamMember | undefined
): ChoreInstance[] {
  const instances: ChoreInstance[] = [];

  for (const chore of chores) {
    const member = getMemberById(chore.assigneeId);
    const color = member?.color || '#cccccc'; // Default gray if member not found

    if (chore.recurrence.type === 'none') {
      // One-time chore
      const choreDate = fromISODateString(chore.date);
      if (!isDateBefore(choreDate, startDate) && !isDateAfter(choreDate, endDate)) {
        instances.push({
          id: chore.id,
          title: chore.title,
          date: chore.date,
          assigneeId: chore.assigneeId,
          color,
          isRecurring: false,
          baseChoreId: chore.id,
        });
      }
    } else if (chore.recurrence.type === 'weekly') {
      // Weekly recurring chore
      instances.push(...generateWeeklyInstances(chore, startDate, endDate, color));
    } else if (chore.recurrence.type === 'monthly') {
      // Monthly recurring chore
      instances.push(...generateMonthlyInstances(chore, startDate, endDate, color));
    }
  }

  return instances;
}
