import type { CardioIntensity, ExerciseEntry, Workout } from "./types";
import { kindForExercise } from "./exercises";

export const DEFAULT_BODY_WEIGHT_LB = 160;

const LBS_TO_KG = 0.45359237;

const CARDIO_MET: Record<string, Record<CardioIntensity, number>> = {
  walking: { easy: 3.0, moderate: 3.8, hard: 5.0 },
  jogging: { easy: 6.0, moderate: 8.0, hard: 10.0 },
  running: { easy: 8.0, moderate: 10.0, hard: 12.0 },
  treadmill: { easy: 4.5, moderate: 7.0, hard: 9.8 },
  "stationary bike": { easy: 4.0, moderate: 6.8, hard: 8.5 },
  "outdoor cycling": { easy: 4.0, moderate: 6.8, hard: 10.0 },
  "rowing machine": { easy: 4.8, moderate: 7.0, hard: 9.5 },
  elliptical: { easy: 4.5, moderate: 5.5, hard: 8.0 },
  "jump rope": { easy: 8.0, moderate: 10.0, hard: 12.3 },
  "stair climber": { easy: 5.0, moderate: 8.0, hard: 10.0 },
  swimming: { easy: 5.0, moderate: 7.0, hard: 9.5 },
  hiit: { easy: 6.0, moderate: 8.5, hard: 11.0 },
  hiking: { easy: 5.0, moderate: 6.0, hard: 7.8 },
};

const DEFAULT_CARDIO_MET: Record<CardioIntensity, number> = {
  easy: 4.0,
  moderate: 6.0,
  hard: 8.0,
};

const STRENGTH_MET = 6;
const MINUTES_PER_SET = 2.5;

export function poundsToKg(pounds: number): number {
  return pounds * LBS_TO_KG;
}

export function metForCardio(name: string, intensity: CardioIntensity): number {
  const key = name.trim().toLowerCase();
  return CARDIO_MET[key]?.[intensity] ?? DEFAULT_CARDIO_MET[intensity];
}

export function caloriesFromMet(met: number, pounds: number, minutes: number): number {
  if (minutes <= 0 || pounds <= 0) return 0;
  return met * poundsToKg(pounds) * (minutes / 60);
}

export function estimateExerciseCalories(
  exercise: ExerciseEntry,
  pounds: number,
): number {
  if ((exercise.kind ?? kindForExercise(exercise.name)) === "cardio") {
    const minutes = exercise.cardio?.minutes ?? 0;
    const intensity = exercise.cardio?.intensity ?? "moderate";
    return caloriesFromMet(metForCardio(exercise.name, intensity), pounds, minutes);
  }
  const done = exercise.sets.filter((set) => set.completed).length;
  return caloriesFromMet(STRENGTH_MET, pounds, done * MINUTES_PER_SET);
}

export function estimateWorkoutCalories(workout: Workout, pounds: number): number {
  const total = workout.exercises.reduce(
    (sum, exercise) => sum + estimateExerciseCalories(exercise, pounds),
    0,
  );
  return Math.round(total);
}

export function formatCalories(kcal: number): string {
  return `${kcal} kcal`;
}
