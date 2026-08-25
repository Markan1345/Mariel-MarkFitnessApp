import type { CustomPlan, PersonId, PlannedExercise, Weekday, WorkoutProgram } from "./types";
import { createId } from "./ids";

function lifts(...names: string[]): PlannedExercise[] {
  return names.map((name) => ({ name, kind: "strength" as const }));
}

function mix(
  items: { name: string; kind: PlannedExercise["kind"] }[],
): PlannedExercise[] {
  return items;
}

export const WORKOUT_PROGRAMS: WorkoutProgram[] = [
  {
    id: "five-by-five",
    title: "5x5 strength",
    blurb: "Three barbell days a week. Add weight when you hit the sets.",
    days: [
      {
        title: "5x5 A",
        weekday: 1,
        exercises: lifts("Back squat", "Barbell bench press", "Barbell row"),
      },
      {
        title: "5x5 B",
        weekday: 3,
        exercises: lifts("Back squat", "Overhead press", "Deadlift"),
      },
      {
        title: "5x5 A",
        weekday: 5,
        exercises: lifts("Back squat", "Barbell bench press", "Barbell row"),
      },
    ],
  },
  {
    id: "ppl",
    title: "Push / pull / legs",
    blurb: "Classic lifting split with a different emphasis each day.",
    days: [
      {
        title: "Push",
        weekday: 1,
        exercises: lifts(
          "Barbell bench press",
          "Incline dumbbell press",
          "Overhead press",
          "Lateral raise",
          "Tricep pushdown",
        ),
      },
      {
        title: "Pull",
        weekday: 3,
        exercises: lifts("Deadlift", "Pull-up", "Barbell row", "Face pull", "Barbell curl"),
      },
      {
        title: "Legs",
        weekday: 5,
        exercises: lifts(
          "Back squat",
          "Romanian deadlift",
          "Walking lunge",
          "Leg curl",
          "Calf raise",
        ),
      },
    ],
  },
  {
    id: "upper-lower",
    title: "Upper / lower",
    blurb: "Four lifting days. Heavy compounds plus accessories.",
    days: [
      {
        title: "Upper A",
        weekday: 1,
        exercises: lifts(
          "Barbell bench press",
          "Barbell row",
          "Overhead press",
          "Lat pulldown",
          "Barbell curl",
        ),
      },
      {
        title: "Lower A",
        weekday: 2,
        exercises: lifts("Back squat", "Romanian deadlift", "Leg press", "Calf raise"),
      },
      {
        title: "Upper B",
        weekday: 4,
        exercises: lifts(
          "Incline dumbbell press",
          "Dumbbell row",
          "Dumbbell shoulder press",
          "Face pull",
          "Hammer curl",
        ),
      },
      {
        title: "Lower B",
        weekday: 5,
        exercises: lifts("Front squat", "Deadlift", "Walking lunge", "Leg curl", "Hip thrust"),
      },
    ],
  },
  {
    id: "glute-lower",
    title: "Glute & lower",
    blurb: "Lower-body days with hip thrusts, squats, and accessories.",
    days: [
      {
        title: "Glute day",
        weekday: 1,
        exercises: lifts("Hip thrust", "Back squat", "Romanian deadlift", "Walking lunge", "Calf raise"),
      },
      {
        title: "Lower accessories",
        weekday: 4,
        exercises: lifts("Goblet squat", "Bulgarian split squat", "Leg curl", "Leg extension", "Hip thrust"),
      },
    ],
  },
  {
    id: "lift-and-cardio",
    title: "Lift + cardio",
    blurb: "Full-body weights with a cardio finisher on off days.",
    days: [
      {
        title: "Full body",
        weekday: 1,
        exercises: lifts("Back squat", "Barbell bench press", "Barbell row", "Overhead press"),
      },
      {
        title: "Cardio",
        weekday: 2,
        exercises: mix([
          { name: "Treadmill", kind: "cardio" },
          { name: "Rowing machine", kind: "cardio" },
        ]),
      },
      {
        title: "Full body",
        weekday: 4,
        exercises: lifts("Deadlift", "Incline dumbbell press", "Pull-up", "Goblet squat"),
      },
      {
        title: "Cardio",
        weekday: 6,
        exercises: mix([
          { name: "Stationary bike", kind: "cardio" },
          { name: "Walking", kind: "cardio" },
        ]),
      },
    ],
  },
];

export function createPlan(input: {
  personId: PersonId;
  title: string;
  weekday: Weekday | null;
  exercises: PlannedExercise[];
  source?: CustomPlan["source"];
}): CustomPlan {
  return {
    id: createId("plan"),
    personId: input.personId,
    title: input.title,
    weekday: input.weekday,
    exercises: input.exercises,
    source: input.source ?? "custom",
    createdAt: new Date().toISOString(),
  };
}

export function plansForPerson(plans: CustomPlan[], personId: PersonId): CustomPlan[] {
  return plans
    .filter((plan) => plan.personId === personId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function planForWeekday(
  plans: CustomPlan[],
  personId: PersonId,
  weekday: Weekday,
): CustomPlan | undefined {
  return plansForPerson(plans, personId).find((plan) => plan.weekday === weekday);
}

export function upsertPlan(plans: CustomPlan[], next: CustomPlan): CustomPlan[] {
  const withoutSameDay = next.weekday === null
    ? plans
    : plans.filter(
        (plan) => !(plan.personId === next.personId && plan.weekday === next.weekday && plan.id !== next.id),
      );
  const index = withoutSameDay.findIndex((plan) => plan.id === next.id);
  if (index === -1) return [next, ...withoutSameDay];
  const copy = [...withoutSameDay];
  copy[index] = next;
  return copy;
}

export function deletePlan(plans: CustomPlan[], id: string): CustomPlan[] {
  return plans.filter((plan) => plan.id !== id);
}

export function importProgram(
  plans: CustomPlan[],
  program: WorkoutProgram,
  personIds: PersonId[],
): CustomPlan[] {
  let next = plans;
  for (const personId of personIds) {
    for (const day of program.days) {
      next = upsertPlan(
        next,
        createPlan({
          personId,
          title: day.title,
          weekday: day.weekday,
          exercises: day.exercises,
          source: "import",
        }),
      );
    }
  }
  return next;
}

export function isWeekday(value: number): value is Weekday {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

export function parseImportedProgram(value: unknown): WorkoutProgram | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as {
    id?: unknown;
    title?: unknown;
    blurb?: unknown;
    days?: unknown;
  };
  if (typeof raw.title !== "string" || !raw.title.trim() || !Array.isArray(raw.days)) {
    return null;
  }
  const days = raw.days.flatMap((day) => {
    if (!day || typeof day !== "object") return [];
    const item = day as { title?: unknown; weekday?: unknown; exercises?: unknown };
    if (typeof item.title !== "string" || !Array.isArray(item.exercises)) return [];
    const weekday =
      item.weekday === null || item.weekday === undefined
        ? null
        : typeof item.weekday === "number" && isWeekday(item.weekday)
          ? item.weekday
          : null;
    const exercises = item.exercises.flatMap((exercise) => {
      if (typeof exercise === "string" && exercise.trim()) {
        return [{ name: exercise.trim(), kind: "strength" as const }];
      }
      if (!exercise || typeof exercise !== "object") return [];
      const entry = exercise as { name?: unknown; kind?: unknown };
      if (typeof entry.name !== "string" || !entry.name.trim()) return [];
      return [
        {
          name: entry.name.trim(),
          kind: entry.kind === "cardio" ? ("cardio" as const) : ("strength" as const),
        },
      ];
    });
    if (exercises.length === 0) return [];
    return [{ title: item.title.trim(), weekday, exercises }];
  });
  if (days.length === 0) return null;
  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : createId("prog"),
    title: raw.title.trim(),
    blurb: typeof raw.blurb === "string" ? raw.blurb : "Imported program",
    days,
  };
}
