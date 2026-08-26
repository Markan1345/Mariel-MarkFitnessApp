import { formatDateLabel } from "@/lib/stats";
import type { PersonId, PlannedExercise, SetEntry, Workout } from "@/lib/types";

export interface LastLift {
  exerciseName: string;
  weight: number;
  reps: number;
  liftedAt: string;
  workoutId: string;
  workoutTitle: string;
}

export function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase();
}

export function exerciseNamesMatch(a: string, b: string): boolean {
  return normalizeExerciseName(a) === normalizeExerciseName(b);
}

function workoutTimestamp(workout: Workout): string {
  return workout.finishedAt ?? workout.startedAt;
}

function isLoggedSet(set: SetEntry): boolean {
  return set.completed && (set.weight ?? 0) > 0 && (set.reps ?? 0) > 0;
}

function bestSet(sets: SetEntry[]): SetEntry | null {
  let best: SetEntry | null = null;
  for (const set of sets) {
    if (!isLoggedSet(set)) continue;
    if (!best || (set.weight ?? 0) > (best.weight ?? 0)) best = set;
  }
  return best;
}

function liftsFromWorkout(workout: Workout): LastLift[] {
  const liftedAt = workoutTimestamp(workout);
  const lifts: LastLift[] = [];

  for (const exercise of workout.exercises) {
    if ((exercise.kind ?? "strength") === "cardio") continue;
    const set = bestSet(exercise.sets);
    if (!set) continue;
    lifts.push({
      exerciseName: exercise.name,
      weight: set.weight ?? 0,
      reps: set.reps ?? 0,
      liftedAt,
      workoutId: workout.id,
      workoutTitle: workout.title,
    });
  }

  return lifts;
}

function isEligibleWorkout(
  workout: Workout,
  personId: PersonId,
  excludeWorkoutId?: string,
): boolean {
  if (workout.personId !== personId) return false;
  if (excludeWorkoutId && workout.id === excludeWorkoutId) return false;
  return workout.finishedAt !== null;
}

export function lastLiftForExercise(
  workouts: Workout[],
  personId: PersonId,
  exerciseName: string,
  options?: { excludeWorkoutId?: string },
): LastLift | null {
  let latest: LastLift | null = null;

  for (const workout of workouts) {
    if (!isEligibleWorkout(workout, personId, options?.excludeWorkoutId)) continue;
    for (const lift of liftsFromWorkout(workout)) {
      if (!exerciseNamesMatch(lift.exerciseName, exerciseName)) continue;
      if (!latest || lift.liftedAt.localeCompare(latest.liftedAt) > 0) {
        latest = lift;
      }
    }
  }

  return latest;
}

export function lastLiftsForExercises(
  workouts: Workout[],
  personId: PersonId,
  exerciseNames: string[],
  options?: { excludeWorkoutId?: string },
): LastLift[] {
  return exerciseNames
    .map((name) => lastLiftForExercise(workouts, personId, name, options))
    .filter((lift): lift is LastLift => lift !== null);
}

export function lastLiftsForPlan(
  workouts: Workout[],
  personId: PersonId,
  exercises: PlannedExercise[],
  options?: { excludeWorkoutId?: string },
): { exercise: PlannedExercise; last: LastLift | null }[] {
  return exercises
    .filter((exercise) => exercise.kind === "strength")
    .map((exercise) => ({
      exercise,
      last: lastLiftForExercise(workouts, personId, exercise.name, options),
    }));
}

export function formatLastLift(lift: LastLift): string {
  return `${lift.weight} lb × ${lift.reps} · ${formatDateLabel(lift.liftedAt)}`;
}

export function formatLastLiftShort(lift: LastLift): string {
  return `${lift.weight} lb · ${formatDateLabel(lift.liftedAt)}`;
}

export function liftHistoryForExercise(
  workouts: Workout[],
  personId: PersonId,
  exerciseName: string,
): LastLift[] {
  const lifts: LastLift[] = [];

  for (const workout of workouts) {
    if (!isEligibleWorkout(workout, personId)) continue;
    for (const lift of liftsFromWorkout(workout)) {
      if (!exerciseNamesMatch(lift.exerciseName, exerciseName)) continue;
      lifts.push(lift);
    }
  }

  return lifts.sort((a, b) => a.liftedAt.localeCompare(b.liftedAt));
}

export function trackedExercises(
  workouts: Workout[],
  personId: PersonId,
): { name: string; last: LastLift; sessions: number }[] {
  const byName = new Map<string, { name: string; last: LastLift; sessions: number }>();

  for (const workout of workouts) {
    if (!isEligibleWorkout(workout, personId)) continue;
    for (const lift of liftsFromWorkout(workout)) {
      const key = normalizeExerciseName(lift.exerciseName);
      const existing = byName.get(key);
      if (!existing) {
        byName.set(key, { name: lift.exerciseName, last: lift, sessions: 1 });
        continue;
      }
      existing.sessions += 1;
      if (lift.liftedAt.localeCompare(existing.last.liftedAt) > 0) {
        existing.last = lift;
        existing.name = lift.exerciseName;
      }
    }
  }

  return [...byName.values()].sort((a, b) => b.last.liftedAt.localeCompare(a.last.liftedAt));
}

export function liftTrend(history: LastLift[], now = new Date()) {
  const current = history.at(-1) ?? null;
  if (!current) {
    return {
      current: null,
      previous: null,
      delta: null,
      weekDelta: null,
      monthDelta: null,
    };
  }
  const previous = history.at(-2) ?? null;
  const today = now.getTime();
  const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = today - 30 * 24 * 60 * 60 * 1000;
  const weekPoint = [...history].reverse().find((lift) => new Date(lift.liftedAt).getTime() <= weekAgo);
  const monthPoint = [...history]
    .reverse()
    .find((lift) => new Date(lift.liftedAt).getTime() <= monthAgo);

  return {
    current,
    previous,
    delta: previous ? roundTenth(current.weight - previous.weight) : null,
    weekDelta: weekPoint ? roundTenth(current.weight - weekPoint.weight) : null,
    monthDelta: monthPoint ? roundTenth(current.weight - monthPoint.weight) : null,
  };
}

function roundTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
