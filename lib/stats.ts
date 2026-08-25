import type { PersonId, Workout } from "./types";
import { startOfLocalDay, startOfWeek } from "./weekdays";

const DAY_MS = 24 * 60 * 60 * 1000;

export { startOfLocalDay };

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
  const weekStart = startOfWeek(now);
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

export function localDayKey(iso: string): string {
  const date = startOfLocalDay(new Date(iso));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const PERSON_ORDER: Record<PersonId, number> = { mark: 0, mariel: 1 };

export function groupWorkoutsByDay(
  workouts: Workout[],
): { key: string; date: Date; workouts: Workout[] }[] {
  const groups = new Map<string, Workout[]>();
  for (const workout of workouts) {
    const key = localDayKey(workout.startedAt);
    const list = groups.get(key) ?? [];
    list.push(workout);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .map(([key, items]) => ({
      key,
      date: startOfLocalDay(new Date(items[0].startedAt)),
      workouts: [...items].sort((a, b) => {
        const byPerson = PERSON_ORDER[a.personId] - PERSON_ORDER[b.personId];
        if (byPerson !== 0) return byPerson;
        return b.startedAt.localeCompare(a.startedAt);
      }),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}
