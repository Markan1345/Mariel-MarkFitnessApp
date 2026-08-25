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

export function weekdayLabel(day: Weekday): string {
  return WEEKDAYS[day]?.label ?? "Day";
}
