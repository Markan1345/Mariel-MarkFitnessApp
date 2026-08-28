import { kindForExercise } from "./exercises";
import type { CardioIntensity, ExerciseEntry } from "./types";

type StepRates = Record<CardioIntensity, number>;

const STEP_RATES: { keys: string[]; spm: StepRates }[] = [
  { keys: ["basketball pickup", "pickup basketball"], spm: { easy: 100, moderate: 135, hard: 165 } },
  { keys: ["volleyball pickup", "pickup volleyball"], spm: { easy: 65, moderate: 85, hard: 110 } },
  { keys: ["soccer pickup", "pickup soccer"], spm: { easy: 110, moderate: 145, hard: 175 } },
  { keys: ["basketball training", "bball training"], spm: { easy: 85, moderate: 110, hard: 140 } },
  { keys: ["basketball game", "basketball"], spm: { easy: 105, moderate: 140, hard: 170 } },
  { keys: ["volleyball"], spm: { easy: 70, moderate: 90, hard: 115 } },
  { keys: ["pickleball"], spm: { easy: 75, moderate: 95, hard: 120 } },
  { keys: ["tennis"], spm: { easy: 80, moderate: 100, hard: 125 } },
  { keys: ["soccer"], spm: { easy: 115, moderate: 150, hard: 180 } },
  { keys: ["football"], spm: { easy: 90, moderate: 125, hard: 155 } },
  { keys: ["martial arts"], spm: { easy: 90, moderate: 115, hard: 145 } },
  { keys: ["jump rope", "jumprope"], spm: { easy: 140, moderate: 180, hard: 220 } },
  { keys: ["stair climber", "stair"], spm: { easy: 110, moderate: 140, hard: 170 } },
  { keys: ["elliptical"], spm: { easy: 100, moderate: 130, hard: 155 } },
  { keys: ["hiking", "hike"], spm: { easy: 95, moderate: 115, hard: 140 } },
  { keys: ["treadmill"], spm: { easy: 100, moderate: 130, hard: 160 } },
  { keys: ["jogging", "jog"], spm: { easy: 130, moderate: 155, hard: 175 } },
  { keys: ["running", "run"], spm: { easy: 150, moderate: 170, hard: 190 } },
  { keys: ["walking", "walk"], spm: { easy: 90, moderate: 110, hard: 130 } },
  { keys: ["boxing", "kickboxing"], spm: { easy: 100, moderate: 130, hard: 160 } },
  { keys: ["hiit", "circuit"], spm: { easy: 110, moderate: 140, hard: 170 } },
  { keys: ["dance", "zumba"], spm: { easy: 90, moderate: 120, hard: 145 } },
  { keys: ["yoga", "stretching"], spm: { easy: 10, moderate: 20, hard: 30 } },
  { keys: ["swimming", "swim"], spm: { easy: 0, moderate: 0, hard: 0 } },
  { keys: ["stationary bike", "outdoor cycling", "cycling", "bike", "spin"], spm: { easy: 0, moderate: 0, hard: 0 } },
  { keys: ["rowing machine", "rowing", "rower"], spm: { easy: 0, moderate: 0, hard: 0 } },
];

const DEFAULT_SPM: StepRates = { easy: 70, moderate: 90, hard: 110 };

export function stepsPerMinuteForCardio(name: string, intensity: CardioIntensity): number {
  const key = name.trim().toLowerCase();
  const matches: { length: number; spm: number }[] = [];
  for (const rule of STEP_RATES) {
    for (const known of rule.keys) {
      if (key === known || key.includes(known)) {
        matches.push({ length: known.length, spm: rule.spm[intensity] });
      }
    }
  }
  matches.sort((a, b) => b.length - a.length);
  return matches[0]?.spm ?? DEFAULT_SPM[intensity];
}

export function estimatedCardioSteps(
  exercise: Pick<ExerciseEntry, "name" | "kind" | "cardio">,
): number {
  if ((exercise.kind ?? kindForExercise(exercise.name)) !== "cardio") return 0;
  const minutes = exercise.cardio?.minutes ?? 0;
  if (minutes <= 0) return 0;
  const intensity = exercise.cardio?.intensity ?? "moderate";
  return Math.round(minutes * stepsPerMinuteForCardio(exercise.name, intensity));
}

/** Logged steps win; otherwise estimate from the activity and minutes. */
export function effectiveCardioSteps(
  exercise: Pick<ExerciseEntry, "name" | "kind" | "cardio">,
): number {
  const logged = exercise.cardio?.steps ?? 0;
  if (logged > 0) return logged;
  return estimatedCardioSteps(exercise);
}

export function isEstimatedCardioSteps(
  exercise: Pick<ExerciseEntry, "name" | "kind" | "cardio">,
): boolean {
  return (exercise.cardio?.steps ?? 0) <= 0 && estimatedCardioSteps(exercise) > 0;
}
