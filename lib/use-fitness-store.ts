"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { AppState, Workout } from "@/lib/types";
import { emptyState } from "@/lib/store";
import {
  patchState,
  readState,
  removeWorkout,
  saveWorkout,
  saveWorkouts,
  subscribeToStore,
} from "@/lib/client-store";

function getSnapshot() {
  return JSON.stringify(readState());
}

function getServerSnapshot() {
  return JSON.stringify(emptyState());
}

export function useFitnessStore() {
  const raw = useSyncExternalStore(subscribeToStore, getSnapshot, getServerSnapshot);
  const state = useMemo<AppState>(() => JSON.parse(raw) as AppState, [raw]);

  const upsert = useCallback((workout: Workout) => {
    saveWorkout(workout);
  }, []);

  const upsertMany = useCallback((workouts: Workout[]) => {
    saveWorkouts(workouts);
  }, []);

  const remove = useCallback((id: string) => {
    removeWorkout(id);
  }, []);

  const patch = useCallback((updater: (current: AppState) => AppState) => {
    patchState(updater);
  }, []);

  return { state, upsert, upsertMany, remove, patch };
}
