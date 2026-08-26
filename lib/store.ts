import type {
  AppState,
  CardioLog,
  CustomPlan,
  ExerciseEntry,
  ExerciseKind,
  PersonId,
  PlannedExercise,
  SetEntry,
  Workout,
} from "./types";
import { createId } from "./ids";
import { kindForExercise } from "./exercises";

export const STORAGE_KEY = "mm-fitness-v1";

export function emptyState(): AppState {
  return { version: 2, workouts: [], plans: [], weights: [] };
}

export function isLegacyState(value: unknown): value is { version: 1; workouts: Workout[] } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { version?: unknown; workouts?: unknown };
  return candidate.version === 1 && Array.isArray(candidate.workouts);
}

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as AppState;
  return (
    candidate.version === 2 &&
    Array.isArray(candidate.workouts) &&
    (candidate.plans === undefined || Array.isArray(candidate.plans)) &&
    (candidate.weights === undefined || Array.isArray(candidate.weights))
  );
}

function defaultCardio(): CardioLog {
  return { minutes: 20, distanceMiles: null, intensity: "moderate" };
}

export function normalizeExercise(exercise: ExerciseEntry): ExerciseEntry {
  const kind: ExerciseKind = exercise.kind ?? kindForExercise(exercise.name);
  return {
    ...exercise,
    kind,
    notes: exercise.notes ?? "",
    sets: kind === "strength" ? exercise.sets ?? [] : exercise.sets ?? [],
    cardio: kind === "cardio" ? (exercise.cardio ?? defaultCardio()) : null,
  };
}

function normalizeWorkout(workout: Workout): Workout {
  return {
    ...workout,
    pairId: workout.pairId ?? null,
    exercises: (workout.exercises ?? []).map(normalizeExercise),
  };
}

function normalizePlan(plan: CustomPlan): CustomPlan {
  return {
    ...plan,
    weekday: plan.weekday ?? null,
    weekStart: plan.weekStart ?? null,
    exercises: plan.exercises ?? [],
    mirrorFrom: plan.mirrorFrom ?? null,
  };
}

export function parseState(raw: string | null): AppState {
  if (!raw) return emptyState();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isAppState(parsed)) {
      return {
        version: 2,
        workouts: parsed.workouts.map(normalizeWorkout),
        plans: (parsed.plans ?? []).map(normalizePlan),
        weights: parsed.weights ?? [],
      };
    }
    if (isLegacyState(parsed)) {
      return {
        version: 2,
        workouts: parsed.workouts.map(normalizeWorkout),
        plans: [],
        weights: [],
      };
    }
  } catch {
    return emptyState();
  }
  return emptyState();
}

export function workoutsForPerson(state: AppState, personId: PersonId): Workout[] {
  return state.workouts
    .filter((workout) => workout.personId === personId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function getWorkout(state: AppState, id: string): Workout | undefined {
  return state.workouts.find((workout) => workout.id === id);
}

export function activeWorkoutForPerson(
  state: AppState,
  personId: PersonId,
): Workout | undefined {
  return workoutsForPerson(state, personId).find((workout) => !workout.finishedAt);
}

export function upsertWorkout(state: AppState, workout: Workout): AppState {
  const index = state.workouts.findIndex((item) => item.id === workout.id);
  if (index === -1) {
    return { ...state, workouts: [workout, ...state.workouts] };
  }
  const next = [...state.workouts];
  next[index] = workout;
  return { ...state, workouts: next };
}

export function deleteWorkout(state: AppState, id: string): AppState {
  return {
    ...state,
    workouts: state.workouts.filter((workout) => workout.id !== id),
  };
}

export function createSet(partial?: Partial<SetEntry>): SetEntry {
  return {
    id: createId("set"),
    reps: partial?.reps ?? 8,
    weight: partial?.weight ?? 0,
    completed: partial?.completed ?? false,
  };
}

export function createExercise(
  name: string,
  kind: ExerciseKind = kindForExercise(name),
  setCount = 1,
): ExerciseEntry {
  if (kind === "cardio") {
    return {
      id: createId("ex"),
      name,
      kind,
      notes: "",
      sets: [],
      cardio: defaultCardio(),
    };
  }
  return {
    id: createId("ex"),
    name,
    kind,
    notes: "",
    sets: Array.from({ length: setCount }, () => createSet()),
    cardio: null,
  };
}

export function createWorkout(input: {
  personId: PersonId;
  title: string;
  exerciseNames?: string[];
  planned?: PlannedExercise[];
  startedAt?: string;
  pairId?: string | null;
}): Workout {
  const planned =
    input.planned ??
    (input.exerciseNames ?? []).map((name) => ({ name, kind: kindForExercise(name) }));
  return {
    id: createId("wo"),
    personId: input.personId,
    title: input.title,
    startedAt: input.startedAt ?? new Date().toISOString(),
    finishedAt: null,
    notes: "",
    exercises: planned.map((item) => createExercise(item.name, item.kind)),
    pairId: input.pairId ?? null,
  };
}

export function createPairedWorkouts(input: {
  mark: { title: string; exerciseNames?: string[]; planned?: PlannedExercise[] };
  mariel: { title: string; exerciseNames?: string[]; planned?: PlannedExercise[] };
  startedAt?: string;
}): { mark: Workout; mariel: Workout } {
  const pairId = createId("pair");
  const startedAt = input.startedAt ?? new Date().toISOString();
  return {
    mark: createWorkout({ personId: "mark", ...input.mark, pairId, startedAt }),
    mariel: createWorkout({ personId: "mariel", ...input.mariel, pairId, startedAt }),
  };
}

export function linkWorkouts(first: Workout, second: Workout): [Workout, Workout] {
  const pairId = first.pairId ?? second.pairId ?? createId("pair");
  return [
    { ...first, pairId },
    { ...second, pairId },
  ];
}

export function upsertWorkouts(state: AppState, workouts: Workout[]): AppState {
  return workouts.reduce((next, workout) => upsertWorkout(next, workout), state);
}

export function addExercise(
  workout: Workout,
  name: string,
  kind: ExerciseKind = kindForExercise(name),
): Workout {
  return {
    ...workout,
    exercises: [...workout.exercises, createExercise(name, kind)],
  };
}

export function updateExercise(
  workout: Workout,
  exerciseId: string,
  updater: (exercise: ExerciseEntry) => ExerciseEntry,
): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) =>
      exercise.id === exerciseId ? updater(exercise) : exercise,
    ),
  };
}

export function removeExercise(workout: Workout, exerciseId: string): Workout {
  return {
    ...workout,
    exercises: workout.exercises.filter((exercise) => exercise.id !== exerciseId),
  };
}

export function addSet(workout: Workout, exerciseId: string): Workout {
  return updateExercise(workout, exerciseId, (exercise) => {
    if (exercise.kind === "cardio") return exercise;
    const last = exercise.sets[exercise.sets.length - 1];
    return {
      ...exercise,
      sets: [
        ...exercise.sets,
        createSet({
          reps: last?.reps ?? 8,
          weight: last?.weight ?? 0,
        }),
      ],
    };
  });
}

export function updateSet(
  workout: Workout,
  exerciseId: string,
  setId: string,
  updater: (set: SetEntry) => SetEntry,
): Workout {
  return updateExercise(workout, exerciseId, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => (set.id === setId ? updater(set) : set)),
  }));
}

export function removeSet(
  workout: Workout,
  exerciseId: string,
  setId: string,
): Workout {
  return updateExercise(workout, exerciseId, (exercise) => ({
    ...exercise,
    sets: exercise.sets.filter((set) => set.id !== setId),
  }));
}

export function finishWorkout(
  workout: Workout,
  finishedAt = new Date().toISOString(),
): Workout {
  return { ...workout, finishedAt };
}

export function duplicateWorkout(
  workout: Workout,
  startedAt = new Date().toISOString(),
): Workout {
  return {
    ...workout,
    id: createId("wo"),
    startedAt,
    finishedAt: null,
    pairId: null,
    exercises: workout.exercises.map((exercise) =>
      normalizeExercise({
        ...exercise,
        id: createId("ex"),
        sets: exercise.sets.map((set) =>
          createSet({
            reps: set.reps,
            weight: set.weight,
            completed: false,
          }),
        ),
        cardio: exercise.cardio ? { ...exercise.cardio } : null,
      }),
    ),
  };
}

export function completedSetCount(workout: Workout): { done: number; total: number } {
  const sets = workout.exercises
    .filter((exercise) => (exercise.kind ?? "strength") === "strength")
    .flatMap((exercise) => exercise.sets);
  return {
    done: sets.filter((set) => set.completed).length,
    total: sets.length,
  };
}

export function cardioMinutes(workout: Workout): number {
  return workout.exercises.reduce((sum, exercise) => {
    if (exercise.kind !== "cardio") return sum;
    return sum + (exercise.cardio?.minutes ?? 0);
  }, 0);
}
