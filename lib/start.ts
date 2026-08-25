import { planForDate } from "@/lib/programs";
import { createWorkout, duplicateWorkout } from "@/lib/store";
import type { CustomPlan, PersonId, Workout, WorkoutTemplate } from "@/lib/types";

export type StartChoice =
  | { type: "empty" }
  | { type: "template"; template: WorkoutTemplate }
  | { type: "plan"; plan: CustomPlan }
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
  if (choice.type === "plan") {
    return createWorkout({
      personId,
      title: choice.plan.title,
      planned: choice.plan.exercises,
    });
  }
  return createWorkout({ personId, title: "Workout" });
}

export function defaultStartChoices(
  plans: CustomPlan[],
  now = new Date(),
): Record<PersonId, StartChoice> {
  const forPerson = (personId: PersonId): StartChoice => {
    const plan = planForDate(plans, personId, now);
    return plan ? { type: "plan", plan } : { type: "empty" };
  };
  return { mark: forPerson("mark"), mariel: forPerson("mariel") };
}
