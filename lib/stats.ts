import type { PersonId, Workout } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(startedAt: string, endedAt: string | null, now = Date.now()): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : now;
  const totalSeconds = Math.max(0, Math.floor((end - start) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function workoutsThisWeek(workouts: Workout[], now = new Date()): Workout[] {
  const today = startOfLocalDay(now);
  const weekday = today.getDay();
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  const weekStart = new Date(today.getTime() - mondayOffset * DAY_MS);
  return workouts.filter((workout) => {
    if (!workout.finishedAt && new Date(workout.startedAt) < weekStart) return false;
    return new Date(workout.startedAt) >= weekStart;
  });
}

export function lastSevenDays(workouts: Workout[], now = new Date()): { date: Date; trained: boolean }[] {
  const today = startOfLocalDay(now);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() - (6 - index) * DAY_MS);
    const trained = workouts.some((workout) => {
      const started = startOfLocalDay(new Date(workout.startedAt));
      return started.getTime() === date.getTime();
    });
    return { date, trained };
  });
}

export function greeting(name: string, now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export function personWorkouts(workouts: Workout[], personId: PersonId): Workout[] {
  return workouts.filter((workout) => workout.personId === personId);
}
