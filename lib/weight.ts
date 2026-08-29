import type { PersonId, WeightEntry } from "./types";
import { DEFAULT_BODY_WEIGHT_LB } from "./calories";
import { createId } from "./ids";
import { localDayKey } from "./stats";

export function weightsForPerson(entries: WeightEntry[], personId: PersonId): WeightEntry[] {
  return entries
    .filter((entry) => entry.personId === personId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function latestWeight(entries: WeightEntry[], personId: PersonId): WeightEntry | undefined {
  return weightsForPerson(entries, personId).at(-1);
}

export function bodyWeightPounds(
  entries: WeightEntry[],
  personId: PersonId,
  fallback = DEFAULT_BODY_WEIGHT_LB,
): number {
  return latestWeight(entries, personId)?.pounds ?? fallback;
}

export function upsertWeight(entries: WeightEntry[], next: WeightEntry): WeightEntry[] {
  const touched: WeightEntry = {
    ...next,
    updatedAt: new Date().toISOString(),
  };
  const index = entries.findIndex(
    (entry) => entry.personId === touched.personId && entry.date === touched.date,
  );
  if (index === -1) return [...entries, touched];
  const copy = [...entries];
  copy[index] = { ...touched, id: copy[index].id };
  return copy;
}

export function createWeightEntry(input: {
  personId: PersonId;
  date: string;
  pounds: number;
  updatedAt?: string;
}): WeightEntry {
  return {
    id: createId("wt"),
    personId: input.personId,
    date: input.date,
    pounds: input.pounds,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function todayKey(now = new Date()): string {
  return localDayKey(now.toISOString());
}

export function weightTrend(entries: WeightEntry[], personId: PersonId, now = new Date()) {
  const list = weightsForPerson(entries, personId);
  const current = list.at(-1);
  if (!current) {
    return {
      current: null,
      previous: null,
      delta: null,
      weekDelta: null,
      monthDelta: null,
    };
  }
  const previous = list.at(-2) ?? null;
  const today = now.getTime();
  const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = today - 30 * 24 * 60 * 60 * 1000;
  const weekPoint = [...list].reverse().find((entry) => new Date(`${entry.date}T12:00:00`).getTime() <= weekAgo);
  const monthPoint = [...list].reverse().find((entry) => new Date(`${entry.date}T12:00:00`).getTime() <= monthAgo);

  return {
    current,
    previous,
    delta: previous ? roundTenth(current.pounds - previous.pounds) : null,
    weekDelta: weekPoint ? roundTenth(current.pounds - weekPoint.pounds) : null,
    monthDelta: monthPoint ? roundTenth(current.pounds - monthPoint.pounds) : null,
  };
}

function roundTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
