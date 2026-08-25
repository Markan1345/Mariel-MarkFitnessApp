"use client";

import { parseState, STORAGE_KEY, emptyState, upsertWorkout, upsertWorkouts, deleteWorkout } from "./store";
import type { AppState, Workout } from "./types";

const CHANGE_EVENT = "mm-fitness-change";

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function readState(): AppState {
  if (typeof window === "undefined") return emptyState();
  return parseState(window.localStorage.getItem(STORAGE_KEY));
}

export function writeState(state: AppState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  emitChange();
}

export function saveWorkout(workout: Workout) {
  writeState(upsertWorkout(readState(), workout));
}

export function saveWorkouts(workouts: Workout[]) {
  writeState(upsertWorkouts(readState(), workouts));
}

export function removeWorkout(id: string) {
  writeState(deleteWorkout(readState(), id));
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
