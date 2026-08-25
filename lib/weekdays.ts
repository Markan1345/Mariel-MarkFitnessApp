import type { Weekday } from "./types";

export const WEEKDAYS: { id: Weekday; label: string; short: string }[] = [
  { id: 0, label: "Sunday", short: "Sun" },
  { id: 1, label: "Monday", short: "Mon" },
  { id: 2, label: "Tuesday", short: "Tue" },
  { id: 3, label: "Wednesday", short: "Wed" },
  { id: 4, label: "Thursday", short: "Thu" },
  { id: 5, label: "Friday", short: "Fri" },
  { id: 6, label: "Saturday", short: "Sat" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function weekdayLabel(day: Weekday): string {
  return WEEKDAYS[day]?.label ?? "Day";
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeek(date: Date): Date {
  const today = startOfLocalDay(date);
  const weekday = today.getDay();
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  return new Date(today.getTime() - mondayOffset * DAY_MS);
}

export function addDays(date: Date, days: number): Date {
  const day = startOfLocalDay(date);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + days);
}

export function localDateKey(date: Date): string {
  const day = startOfLocalDay(date);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

export function weekStartKey(date: Date): string {
  return localDateKey(startOfWeek(date));
}

export function nextWeekStart(date: Date): Date {
  return addDays(startOfWeek(date), 7);
}

export function datesInWeek(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function formatWeekRange(weekStart: Date): string {
  const start = startOfLocalDay(weekStart);
  const end = addDays(start, 6);
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

export function weekdayFromDate(date: Date): Weekday {
  return date.getDay() as Weekday;
}
