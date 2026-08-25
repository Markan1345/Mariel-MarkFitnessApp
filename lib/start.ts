import { createWorkout, duplicateWorkout } from "@/lib/store";
import type { PersonId, Workout, WorkoutTemplate } from "@/lib/types";

export type StartChoice =
  | { type: "empty" }
  | { type: "template"; template: WorkoutTemplate }
  | { type: "repeat"; workout: Workout };

export function workoutFromChoice(personId: PersonId, choice: StartChoice): Workout {
  if (choice.type === "repeat") {
    return { ...duplicateWorkout(choice.workout), personId };
  }
  if (choice.type === "template") {
    return createWorkout({
      personId,
      title: choice.template.title,
      exerciseNames: choice.template.exercises,
    });
  }
  return createWorkout({ personId, title: "Workout" });
}
