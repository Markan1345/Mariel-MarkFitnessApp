"use client";

import {
  parseState,
  STORAGE_KEY,
  emptyState,
  upsertWorkout,
  upsertWorkouts,
  deleteWorkout,
} from "./store";
import type { AppState, Workout } from "./types";

const CHANGE_EVENT = "mm-fitness-change";

type WriteOptions = {
  /** When true, skip scheduling a cloud push (used while applying remote sync). */
  fromSync?: boolean;
};

let skipNextPush = false;

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function readState(): AppState {
  if (typeof window === "undefined") return emptyState();
  return parseState(window.localStorage.getItem(STORAGE_KEY));
}

export function writeState(state: AppState, options?: WriteOptions) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (options?.fromSync) {
    skipNextPush = true;
  }
  emitChange();
  if (!options?.fromSync) {
    void import("./sync-client")
      .then(({ scheduleSyncPush }) => scheduleSyncPush())
      .catch(() => {
        /* sync optional at boot */
      });
  }
}

export function consumeSkipPush(): boolean {
  if (!skipNextPush) return false;
  skipNextPush = false;
  return true;
}

export function patchState(updater: (state: AppState) => AppState) {
  const previous = readState();
  const next = updater(previous);
  writeState(next);
  const removed = collectRemovedIds(previous, next);
  if (removed.length > 0) {
    void import("./sync-client")
      .then(({ rememberRemovedIds }) => rememberRemovedIds(removed))
      .catch(() => {
        /* sync optional */
      });
  }
}

function collectRemovedIds(previous: AppState, next: AppState): string[] {
  const nextIds = new Set([
    ...next.workouts.map((item) => item.id),
    ...next.plans.map((item) => item.id),
    ...next.weights.map((item) => item.id),
    ...(next.stepLogs ?? []).map((item) => item.id),
  ]);
  const removed: string[] = [];
  for (const item of previous.workouts) {
    if (!nextIds.has(item.id)) removed.push(item.id);
  }
  for (const item of previous.plans) {
    if (!nextIds.has(item.id)) removed.push(item.id);
  }
  for (const item of previous.weights) {
    if (!nextIds.has(item.id)) removed.push(item.id);
  }
  for (const item of previous.stepLogs ?? []) {
    if (!nextIds.has(item.id)) removed.push(item.id);
  }
  return removed;
}

export function saveWorkout(workout: Workout) {
  writeState(upsertWorkout(readState(), workout));
}

export function saveWorkouts(workouts: Workout[]) {
  writeState(upsertWorkouts(readState(), workouts));
}

export function removeWorkout(id: string) {
  const previous = readState();
  writeState(deleteWorkout(previous, id));
  void import("./sync-client")
    .then(({ rememberRemovedIds }) => rememberRemovedIds([id]))
    .catch(() => {
      /* sync optional */
    });
}

export function subscribeToStore(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
