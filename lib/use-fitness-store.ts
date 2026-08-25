"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { AppState, Workout } from "@/lib/types";
import { emptyState } from "@/lib/store";
import { readState, removeWorkout, saveWorkout, subscribeToStore } from "@/lib/client-store";

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

  const remove = useCallback((id: string) => {
    removeWorkout(id);
  }, []);

  return { state, upsert, remove };
}
