import type { ExerciseTemplate, MuscleGroup, WorkoutTemplate } from "./types";

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

export const EXERCISE_LIBRARY: ExerciseTemplate[] = [
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
  { name: "Treadmill", group: "cardio" },
  { name: "Stationary bike", group: "cardio" },
  { name: "Rowing machine", group: "cardio" },
  { name: "Elliptical", group: "cardio" },
  { name: "Jump rope", group: "cardio" },
  { name: "Farmer carry", group: "full-body" },
  { name: "Kettlebell swing", group: "full-body" },
  { name: "Burpee", group: "full-body" },
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
    exercises: [
      "Deadlift",
      "Pull-up",
      "Barbell row",
      "Face pull",
      "Barbell curl",
    ],
  },
  {
    id: "legs",
    title: "Leg day",
    group: "legs",
    exercises: [
      "Back squat",
      "Romanian deadlift",
      "Walking lunge",
      "Leg curl",
      "Calf raise",
    ],
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
    exercises: [
      "Back squat",
      "Barbell bench press",
      "Barbell row",
      "Overhead press",
      "Plank",
    ],
  },
  {
    id: "cardio",
    title: "Cardio",
    group: "cardio",
    exercises: ["Treadmill", "Rowing machine"],
  },
];

export function searchExercises(query: string): ExerciseTemplate[] {
  const q = query.trim().toLowerCase();
  if (!q) return EXERCISE_LIBRARY;
  return EXERCISE_LIBRARY.filter((exercise) =>
    exercise.name.toLowerCase().includes(q),
  );
}
