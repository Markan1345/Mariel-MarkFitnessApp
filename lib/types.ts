export type PersonId = "mark" | "mariel";

export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "cardio"
  | "full-body";

export interface SetEntry {
  id: string;
  reps: number | null;
  weight: number | null;
  completed: boolean;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  notes: string;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  personId: PersonId;
  title: string;
  startedAt: string;
  finishedAt: string | null;
  notes: string;
  exercises: ExerciseEntry[];
  pairId: string | null;
}

export interface AppState {
  version: 1;
  workouts: Workout[];
}

export interface ExerciseTemplate {
  name: string;
  group: MuscleGroup;
}

export interface WorkoutTemplate {
  id: string;
  title: string;
  group: MuscleGroup;
  exercises: string[];
}
