import type { AppState, DailyStepLog, PersonId, StepEntry, Workout } from "./types";
import { createId } from "./ids";
import { cardioSteps } from "./store";
import { localDayKey } from "./stats";
import { datesInMonth, datesInWeek, localDateKey, startOfWeek } from "./weekdays";
import { todayKey } from "./weight";

export const LIVE_STEP_ENTRY_LABEL = "Live counter";

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

export function stepEntriesForDay(
  logs: DailyStepLog[],
  personId: PersonId,
  date: string,
): StepEntry[] {
  return stepLogForDay(logs, personId, date)?.entries ?? [];
}

export function phoneStepsForDay(logs: DailyStepLog[], personId: PersonId, date: string): number {
  return stepEntriesForDay(logs, personId, date).reduce((sum, entry) => sum + entry.steps, 0);
}

export function liveCounterSteps(logs: DailyStepLog[], personId: PersonId, date: string): number {
  return (
    stepEntriesForDay(logs, personId, date).find((entry) => entry.label === LIVE_STEP_ENTRY_LABEL)
      ?.steps ?? 0
  );
}

export function createStepEntry(input: {
  steps: number;
  label?: string;
  updatedAt?: string;
}): StepEntry {
  return {
    id: createId("se"),
    steps: Math.max(0, Math.round(input.steps)),
    label: input.label,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

/** Test helper: one log with a single entry matching the legacy phoneSteps shape. */
export function createStepLog(input: {
  personId: PersonId;
  date: string;
  phoneSteps: number;
  updatedAt?: string;
}): DailyStepLog {
  const updatedAt = input.updatedAt ?? new Date().toISOString();
  return {
    id: createId("st"),
    personId: input.personId,
    date: input.date,
    entries: [createStepEntry({ steps: input.phoneSteps, updatedAt })],
    updatedAt,
  };
}

function touchStepLog(log: DailyStepLog, entries: StepEntry[]): DailyStepLog {
  const updatedAt = new Date().toISOString();
  return {
    ...log,
    entries,
    updatedAt,
  };
}

function upsertDayLog(logs: DailyStepLog[], log: DailyStepLog): DailyStepLog[] {
  const index = logs.findIndex((entry) => entry.personId === log.personId && entry.date === log.date);
  if (index === -1) return [...logs, log];
  const copy = [...logs];
  copy[index] = { ...log, id: copy[index].id };
  return copy;
}

export function addStepEntry(
  logs: DailyStepLog[],
  input: { personId: PersonId; date: string; steps: number; label?: string },
): DailyStepLog[] {
  const entry = createStepEntry({ steps: input.steps, label: input.label });
  const existing = stepLogForDay(logs, input.personId, input.date);
  if (!existing) {
    return upsertDayLog(
      logs,
      touchStepLog(
        {
          id: createId("st"),
          personId: input.personId,
          date: input.date,
          entries: [],
          updatedAt: new Date().toISOString(),
        },
        [entry],
      ),
    );
  }
  return upsertDayLog(logs, touchStepLog(existing, [...existing.entries, entry]));
}

export function updateStepEntry(
  logs: DailyStepLog[],
  input: { personId: PersonId; date: string; entryId: string; steps: number },
): DailyStepLog[] {
  const log = stepLogForDay(logs, input.personId, input.date);
  if (!log) return logs;
  const nextSteps = Math.max(0, Math.round(input.steps));
  const entries = log.entries.map((entry) =>
    entry.id === input.entryId
      ? { ...entry, steps: nextSteps, updatedAt: new Date().toISOString() }
      : entry,
  );
  return upsertDayLog(logs, touchStepLog(log, entries));
}

export function removeStepEntry(
  logs: DailyStepLog[],
  input: { personId: PersonId; date: string; entryId: string },
): DailyStepLog[] {
  const log = stepLogForDay(logs, input.personId, input.date);
  if (!log) return logs;
  const entries = log.entries.filter((entry) => entry.id !== input.entryId);
  if (entries.length === 0) {
    return logs.filter((item) => item.id !== log.id);
  }
  return upsertDayLog(logs, touchStepLog(log, entries));
}

export function upsertLabeledStepEntry(
  logs: DailyStepLog[],
  input: { personId: PersonId; date: string; label: string; steps: number },
): DailyStepLog[] {
  const log = stepLogForDay(logs, input.personId, input.date);
  const nextSteps = Math.max(0, Math.round(input.steps));
  const updatedAt = new Date().toISOString();
  if (!log) {
    return upsertDayLog(
      logs,
      touchStepLog(
        {
          id: createId("st"),
          personId: input.personId,
          date: input.date,
          entries: [],
          updatedAt,
        },
        [createStepEntry({ steps: nextSteps, label: input.label, updatedAt })],
      ),
    );
  }
  const index = log.entries.findIndex((entry) => entry.label === input.label);
  if (index === -1) {
    return addStepEntry(logs, {
      personId: input.personId,
      date: input.date,
      steps: nextSteps,
      label: input.label,
    });
  }
  const entries = [...log.entries];
  entries[index] = {
    ...entries[index],
    steps: nextSteps,
    updatedAt,
  };
  return upsertDayLog(logs, touchStepLog(log, entries));
}

export function clearPhoneStepsForDay(
  logs: DailyStepLog[],
  personId: PersonId,
  date: string,
): DailyStepLog[] {
  return logs.filter((entry) => !(entry.personId === personId && entry.date === date));
}

/** @deprecated Prefer addStepEntry / updateStepEntry. Replaces the whole day log. */
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
  const phoneSteps = phoneStepsForDay(state.stepLogs ?? [], personId, date);
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

export function stepHistoryForWeek(
  state: Pick<AppState, "workouts" | "stepLogs">,
  personId: PersonId,
  now = new Date(),
): StepDayTotal[] {
  return datesInWeek(startOfWeek(now)).map((date) =>
    dailyStepTotal(state, personId, localDateKey(date)),
  );
}

export function stepHistoryForMonth(
  state: Pick<AppState, "workouts" | "stepLogs">,
  personId: PersonId,
  now = new Date(),
): StepDayTotal[] {
  return datesInMonth(now).map((date) => dailyStepTotal(state, personId, localDateKey(date)));
}

export function stepsThisMonth(
  state: Pick<AppState, "workouts" | "stepLogs">,
  personId: PersonId,
  now = new Date(),
): number {
  return stepHistoryForMonth(state, personId, now).reduce((sum, day) => sum + day.total, 0);
}

export function averageDailySteps(days: StepDayTotal[], now = new Date()): number {
  const today = localDateKey(now);
  const elapsed = days.filter((day) => day.date <= today);
  if (elapsed.length === 0) return 0;
  return Math.round(elapsed.reduce((sum, day) => sum + day.total, 0) / elapsed.length);
}
