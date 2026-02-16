import { format, parse, addDays, addMonths, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';

/**
 * Format a Date object to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse ISO date string to Date object
 */
export function fromISODateString(dateString: string): Date {
  return parse(dateString, 'yyyy-MM-dd', new Date());
}

/**
 * Get today's date as ISO string
 */
export function getTodayISOString(): string {
  return toISODateString(new Date());
}

/**
 * Add N days to a date
 */
export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

/**
 * Add N months to a date
 */
export function addMonthsToDate(date: Date, months: number): Date {
  return addMonths(date, months);
}

/**
 * Check if date1 is after date2
 */
export function isDateAfter(date1: Date, date2: Date): boolean {
  return isAfter(startOfDay(date1), startOfDay(date2));
}

/**
 * Check if date1 is before date2
 */
export function isDateBefore(date1: Date, date2: Date): boolean {
  return isBefore(startOfDay(date1), startOfDay(date2));
}

/**
 * Get the last day of a month for a given date
 */
export function getLastDayOfMonth(date: Date): number {
  const nextMonth = addMonths(startOfDay(date), 1);
  const lastDay = addDays(nextMonth, -1);
  return lastDay.getDate();
}

/**
 * Set day of month, clamping to last day if day > days in month
 * E.g., day 31 in February becomes Feb 28/29
 */
export function setDayOfMonth(date: Date, day: number): Date {
  const newDate = new Date(date);
  const lastDay = getLastDayOfMonth(date);
  const clampedDay = Math.min(day, lastDay);
  newDate.setDate(clampedDay);
  return newDate;
}
