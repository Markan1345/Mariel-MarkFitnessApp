import type { AppState, DailyStepLog, PersonId, Workout } from "./types";
import { createId } from "./ids";
import { cardioSteps } from "./store";
import { localDayKey } from "./stats";
import { datesInWeek, localDateKey, startOfWeek } from "./weekdays";
import { todayKey } from "./weight";

export type StepDayTotal = {
  date: string;
  phoneSteps: number;
  workoutSteps: number;
  total: number;
};

export function stepLogsForPerson(logs: DailyStepLog[], personId: PersonId): DailyStepLog[] {
  return logs
    .filter((entry) => entry.personId === personId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function stepLogForDay(
  logs: DailyStepLog[],
  personId: PersonId,
  date: string,
): DailyStepLog | undefined {
  return logs.find((entry) => entry.personId === personId && entry.date === date);
}

export function createStepLog(input: {
  personId: PersonId;
  date: string;
  phoneSteps: number;
  updatedAt?: string;
}): DailyStepLog {
  return {
    id: createId("st"),
    personId: input.personId,
    date: input.date,
    phoneSteps: Math.max(0, Math.round(input.phoneSteps)),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function upsertStepLog(logs: DailyStepLog[], next: DailyStepLog): DailyStepLog[] {
  const index = logs.findIndex((entry) => entry.personId === next.personId && entry.date === next.date);
  if (index === -1) return [...logs, next];
  const copy = [...logs];
  copy[index] = { ...next, id: copy[index].id };
  return copy;
}

export function workoutStepsForDay(
  workouts: Workout[],
  personId: PersonId,
  date: string,
): number {
  return workouts
    .filter((workout) => workout.personId === personId && localDayKey(workout.startedAt) === date)
    .reduce((sum, workout) => sum + cardioSteps(workout), 0);
}

export function dailyStepTotal(
  state: Pick<AppState, "workouts" | "stepLogs">,
  personId: PersonId,
  date: string,
): StepDayTotal {
  const phoneSteps = stepLogForDay(state.stepLogs ?? [], personId, date)?.phoneSteps ?? 0;
  const workoutSteps = workoutStepsForDay(state.workouts, personId, date);
  return {
    date,
    phoneSteps,
    workoutSteps,
    total: phoneSteps + workoutSteps,
  };
}

export function stepHistory(
  state: Pick<AppState, "workouts" | "stepLogs">,
  personId: PersonId,
  days = 14,
  now = new Date(),
): StepDayTotal[] {
  const today = localDateKey(now);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(`${today}T12:00:00`);
    date.setDate(date.getDate() - (days - 1 - index));
    return dailyStepTotal(state, personId, localDateKey(date));
  });
}

export function stepsThisWeek(
  state: Pick<AppState, "workouts" | "stepLogs">,
  personId: PersonId,
  now = new Date(),
): number {
  return datesInWeek(startOfWeek(now)).reduce(
    (sum, date) => sum + dailyStepTotal(state, personId, localDateKey(date)).total,
    0,
  );
}

export function todayStepTotal(
  state: Pick<AppState, "workouts" | "stepLogs">,
  personId: PersonId,
  now = new Date(),
): StepDayTotal {
  return dailyStepTotal(state, personId, todayKey(now));
}
