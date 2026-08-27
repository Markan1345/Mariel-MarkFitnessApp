import type { ExerciseKind, ExerciseTemplate, MuscleGroup, WorkoutTemplate } from "./types";

export const MUSCLE_GROUPS: { id: MuscleGroup; label: string }[] = [
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "legs", label: "Legs" },
  { id: "shoulders", label: "Shoulders" },
  { id: "arms", label: "Arms" },
  { id: "core", label: "Core" },
  { id: "cardio", label: "Cardio" },
  { id: "full-body", label: "Full body" },
];

const LIFTS: { name: string; group: Exclude<MuscleGroup, "cardio"> }[] = [
  { name: "Barbell bench press", group: "chest" },
  { name: "Incline dumbbell press", group: "chest" },
  { name: "Dumbbell fly", group: "chest" },
  { name: "Push-up", group: "chest" },
  { name: "Cable crossover", group: "chest" },
  { name: "Chest dip", group: "chest" },
  { name: "Lat pulldown", group: "back" },
  { name: "Pull-up", group: "back" },
  { name: "Barbell row", group: "back" },
  { name: "Seated cable row", group: "back" },
  { name: "Dumbbell row", group: "back" },
  { name: "Face pull", group: "back" },
  { name: "Deadlift", group: "back" },
  { name: "Back squat", group: "legs" },
  { name: "Front squat", group: "legs" },
  { name: "Romanian deadlift", group: "legs" },
  { name: "Walking lunge", group: "legs" },
  { name: "Leg press", group: "legs" },
  { name: "Leg curl", group: "legs" },
  { name: "Leg extension", group: "legs" },
  { name: "Bulgarian split squat", group: "legs" },
  { name: "Calf raise", group: "legs" },
  { name: "Hip thrust", group: "legs" },
  { name: "Goblet squat", group: "legs" },
  { name: "Overhead press", group: "shoulders" },
  { name: "Dumbbell shoulder press", group: "shoulders" },
  { name: "Lateral raise", group: "shoulders" },
  { name: "Rear delt fly", group: "shoulders" },
  { name: "Arnold press", group: "shoulders" },
  { name: "Barbell curl", group: "arms" },
  { name: "Hammer curl", group: "arms" },
  { name: "Tricep pushdown", group: "arms" },
  { name: "Skull crusher", group: "arms" },
  { name: "Close-grip bench press", group: "arms" },
  { name: "Plank", group: "core" },
  { name: "Hanging leg raise", group: "core" },
  { name: "Cable crunch", group: "core" },
  { name: "Ab wheel", group: "core" },
  { name: "Russian twist", group: "core" },
  { name: "Farmer carry", group: "full-body" },
  { name: "Kettlebell swing", group: "full-body" },
  { name: "Burpee", group: "full-body" },
];

const CARDIO: string[] = [
  "Walking",
  "Jogging",
  "Running",
  "Treadmill",
  "Stationary bike",
  "Outdoor cycling",
  "Rowing machine",
  "Elliptical",
  "Jump rope",
  "Stair climber",
  "Swimming",
  "HIIT",
  "Hiking",
  "Basketball training",
  "Basketball game",
  "Soccer",
  "Football",
  "Tennis",
  "Volleyball",
  "Pickleball",
  "Boxing",
  "Dance",
  "Martial arts",
];

export const EXERCISE_LIBRARY: ExerciseTemplate[] = [
  ...LIFTS.map((item) => ({ ...item, kind: "strength" as const })),
  ...CARDIO.map((name) => ({ name, group: "cardio" as const, kind: "cardio" as const })),
];

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "push",
    title: "Push day",
    group: "chest",
    exercises: [
      "Barbell bench press",
      "Incline dumbbell press",
      "Overhead press",
      "Lateral raise",
      "Tricep pushdown",
    ],
  },
  {
    id: "pull",
    title: "Pull day",
    group: "back",
    exercises: ["Deadlift", "Pull-up", "Barbell row", "Face pull", "Barbell curl"],
  },
  {
    id: "legs",
    title: "Leg day",
    group: "legs",
    exercises: ["Back squat", "Romanian deadlift", "Walking lunge", "Leg curl", "Calf raise"],
  },
  {
    id: "upper",
    title: "Upper body",
    group: "chest",
    exercises: [
      "Barbell bench press",
      "Lat pulldown",
      "Dumbbell shoulder press",
      "Seated cable row",
      "Hammer curl",
    ],
  },
  {
    id: "full",
    title: "Full body",
    group: "full-body",
    exercises: ["Back squat", "Barbell bench press", "Barbell row", "Overhead press", "Plank"],
  },
  {
    id: "cardio",
    title: "Cardio",
    group: "cardio",
    exercises: ["Treadmill", "Rowing machine"],
  },
  {
    id: "basketball",
    title: "Basketball",
    group: "cardio",
    exercises: ["Basketball training", "Basketball game"],
  },
  {
    id: "five-a",
    title: "5x5 A",
    group: "full-body",
    exercises: ["Back squat", "Barbell bench press", "Barbell row"],
  },
  {
    id: "five-b",
    title: "5x5 B",
    group: "full-body",
    exercises: ["Back squat", "Overhead press", "Deadlift"],
  },
];

const CARDIO_HINT =
  /walk|jog|run|treadmill|bike|cycl|row|elliptical|jump rope|stair|swim|hiit|hike|cardio|basketball|soccer|football|tennis|volleyball|pickleball|boxing|dance|martial/;

export function kindForExercise(name: string): ExerciseKind {
  const found = EXERCISE_LIBRARY.find((item) => item.name.toLowerCase() === name.trim().toLowerCase());
  if (found) return found.kind;
  return CARDIO_HINT.test(name.toLowerCase()) ? "cardio" : "strength";
}

export function searchExercises(query: string): ExerciseTemplate[] {
  const q = query.trim().toLowerCase();
  if (!q) return EXERCISE_LIBRARY;
  return EXERCISE_LIBRARY.filter((exercise) => exercise.name.toLowerCase().includes(q));
}
