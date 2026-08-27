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

export type ExerciseKind = "strength" | "cardio";
export type CardioIntensity = "easy" | "moderate" | "hard";
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface SetEntry {
  id: string;
  reps: number | null;
  weight: number | null;
  completed: boolean;
}

export interface CardioLog {
  minutes: number | null;
  distanceMiles: number | null;
  intensity: CardioIntensity;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  kind?: ExerciseKind;
  notes: string;
  sets: SetEntry[];
  cardio: CardioLog | null;
}

export interface PlannedExercise {
  name: string;
  kind: ExerciseKind;
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

export type PlanKind = "workout" | "rest";

export interface CustomPlan {
  id: string;
  personId: PersonId;
  title: string;
  weekday: Weekday | null;
  /** Monday YYYY-MM-DD for a specific week, or null for the repeating usual day. */
  weekStart: string | null;
  exercises: PlannedExercise[];
  source: "custom" | "import";
  /** workout (default) or intentional rest day. */
  kind?: PlanKind;
  /** When set, this day follows that person's workout for the same weekday. */
  mirrorFrom?: PersonId | null;
  createdAt: string;
}

export interface WeightEntry {
  id: string;
  personId: PersonId;
  date: string;
  pounds: number;
}

export interface AppState {
  version: 2;
  workouts: Workout[];
  plans: CustomPlan[];
  weights: WeightEntry[];
}

export interface ExerciseTemplate {
  name: string;
  group: MuscleGroup;
  kind: ExerciseKind;
}

export interface WorkoutTemplate {
  id: string;
  title: string;
  group: MuscleGroup;
  exercises: string[];
}

export interface ProgramDay {
  title: string;
  weekday: Weekday | null;
  exercises: PlannedExercise[];
}

export interface WorkoutProgram {
  id: string;
  title: string;
  blurb: string;
  days: ProgramDay[];
}
