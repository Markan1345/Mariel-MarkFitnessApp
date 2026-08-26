import { describe, expect, it } from "vitest";
import {
  copyWeekPlans,
  copyPlanFromPerson,
  createPlan,
  importProgram,
  parseImportedProgram,
  planForDate,
  planForWeekday,
  savePlanForWeek,
  setDayMirror,
  upsertPlan,
  WORKOUT_PROGRAMS,
} from "@/lib/programs";

describe("programs", () => {
  it("imports a lifting program onto weekdays for a person", () => {
    const five = WORKOUT_PROGRAMS.find((item) => item.id === "five-by-five");
    expect(five).toBeTruthy();
    const plans = importProgram([], five!, ["mariel"]);
    expect(planForWeekday(plans, "mariel", 1)?.title).toBe("5x5 A");
    expect(planForWeekday(plans, "mariel", 3)?.title).toBe("5x5 B");
    expect(planForWeekday(plans, "mark", 1)).toBeUndefined();
    expect(plans.every((plan) => plan.exercises.some((item) => item.kind === "strength"))).toBe(true);
    expect(plans.every((plan) => plan.weekStart === null)).toBe(true);
  });

  it("parses a JSON program with mixed strength and cardio", () => {
    const parsed = parseImportedProgram({
      title: "Home week",
      days: [
        {
          title: "Monday lift",
          weekday: 1,
          exercises: ["Back squat", { name: "Treadmill", kind: "cardio" }],
        },
      ],
    });
    expect(parsed?.title).toBe("Home week");
    expect(parsed?.days[0].exercises).toEqual([
      { name: "Back squat", kind: "strength" },
      { name: "Treadmill", kind: "cardio" },
    ]);
    expect(parseImportedProgram({ title: "Nope", days: [] })).toBeNull();
  });

  it("imports mixed lift and cardio days onto a week", () => {
    const program = WORKOUT_PROGRAMS.find((item) => item.id === "lift-and-cardio");
    expect(program).toBeTruthy();
    const plans = importProgram([], program!, ["mark"]);
    expect(planForWeekday(plans, "mark", 1)?.exercises.every((item) => item.kind === "strength")).toBe(true);
    expect(planForWeekday(plans, "mark", 2)?.exercises.every((item) => item.kind === "cardio")).toBe(true);
  });

  it("keeps a next-week day separate from the usual weekday", () => {
    const usual = createPlan({
      personId: "mark",
      title: "Usual Monday",
      weekday: 1,
      exercises: [{ name: "Back squat", kind: "strength" }],
    });
    const nextWeek = createPlan({
      personId: "mark",
      title: "Next Monday",
      weekday: 1,
      weekStart: "2026-08-31",
      exercises: [{ name: "Deadlift", kind: "strength" }],
    });
    const plans = upsertPlan(upsertPlan([], usual), nextWeek);

    expect(planForWeekday(plans, "mark", 1)?.title).toBe("Usual Monday");
    expect(planForWeekday(plans, "mark", 1, "2026-08-31")?.title).toBe("Next Monday");
    expect(planForWeekday(plans, "mark", 1, "2026-08-24")?.title).toBe("Usual Monday");
    expect(planForDate(plans, "mark", new Date("2026-08-24T12:00:00"))?.title).toBe("Usual Monday");
    expect(planForDate(plans, "mark", new Date("2026-08-31T12:00:00"))?.title).toBe("Next Monday");
    expect(plans.filter((plan) => plan.weekday === 1)).toHaveLength(2);
  });

  it("copies this week's effective plans onto next week", () => {
    const usual = createPlan({
      personId: "mariel",
      title: "Push",
      weekday: 1,
      exercises: [{ name: "Barbell bench press", kind: "strength" }],
    });
    const thisMonday = createPlan({
      personId: "mariel",
      title: "This Monday",
      weekday: 1,
      weekStart: "2026-08-24",
      exercises: [{ name: "Incline dumbbell press", kind: "strength" }],
    });
    const copied = copyWeekPlans([usual, thisMonday], "mariel", "2026-08-24", "2026-08-31");
    expect(planForWeekday(copied, "mariel", 1, "2026-08-31")?.title).toBe("This Monday");
    expect(planForWeekday(copied, "mariel", 1)?.title).toBe("Push");
    expect(planForDate(copied, "mariel", new Date("2026-08-31T12:00:00"))?.exercises[0].name).toBe(
      "Incline dumbbell press",
    );
  });

  it("does not overwrite a next-week day that is already planned", () => {
    const usual = createPlan({
      personId: "mark",
      title: "Usual Monday",
      weekday: 1,
      exercises: [{ name: "Back squat", kind: "strength" }],
    });
    const planned = createPlan({
      personId: "mark",
      title: "Next week strength",
      weekday: 1,
      weekStart: "2026-08-31",
      exercises: [{ name: "Deadlift", kind: "strength" }],
    });
    const copied = copyWeekPlans([usual, planned], "mark", "2026-08-24", "2026-08-31");
    expect(planForWeekday(copied, "mark", 1, "2026-08-31")?.title).toBe("Next week strength");
  });

  it("saves a week plan without replacing the usual day unless asked", () => {
    const usual = createPlan({
      personId: "mark",
      title: "Usual Friday",
      weekday: 5,
      exercises: [{ name: "Back squat", kind: "strength" }],
    });
    const nextFriday = createPlan({
      personId: "mark",
      title: "Long run",
      weekday: 5,
      weekStart: "2026-08-31",
      exercises: [{ name: "Treadmill", kind: "cardio" }],
    });
    const weekOnly = savePlanForWeek([usual], nextFriday, false);
    expect(planForWeekday(weekOnly, "mark", 5)?.title).toBe("Usual Friday");
    expect(planForWeekday(weekOnly, "mark", 5, "2026-08-31")?.title).toBe("Long run");

    const withUsual = savePlanForWeek([usual], nextFriday, true);
    expect(planForWeekday(withUsual, "mark", 5)?.title).toBe("Long run");
    expect(planForWeekday(withUsual, "mark", 5)?.weekStart).toBeNull();
    expect(planForWeekday(withUsual, "mark", 5, "2026-08-31")?.title).toBe("Long run");
  });

  it("lets Mariel mirror Mark's workout for a specific day", () => {
    const markMonday = createPlan({
      personId: "mark",
      title: "5x5 A",
      weekday: 1,
      exercises: [
        { name: "Back squat", kind: "strength" },
        { name: "Barbell bench press", kind: "strength" },
      ],
    });
    let plans = setDayMirror([markMonday], {
      personId: "mariel",
      weekday: 1,
      weekStart: null,
      mirrorFrom: "mark",
    });

    const mirrored = planForWeekday(plans, "mariel", 1);
    expect(mirrored?.mirrorFrom).toBe("mark");
    expect(mirrored?.title).toBe("5x5 A");
    expect(mirrored?.exercises.map((item) => item.name)).toEqual([
      "Back squat",
      "Barbell bench press",
    ]);

    plans = upsertPlan(plans, {
      ...markMonday,
      title: "Updated 5x5 A",
      exercises: [{ name: "Deadlift", kind: "strength" }],
    });
    expect(planForWeekday(plans, "mariel", 1)?.title).toBe("Updated 5x5 A");
    expect(planForWeekday(plans, "mariel", 1)?.exercises[0].name).toBe("Deadlift");

    plans = setDayMirror(plans, {
      personId: "mariel",
      weekday: 1,
      weekStart: null,
      mirrorFrom: null,
    });
    expect(planForWeekday(plans, "mariel", 1)).toBeUndefined();
  });

  it("copies Mark's day into Mariel's own editable plan", () => {
    const markMonday = createPlan({
      personId: "mark",
      title: "Push",
      weekday: 1,
      exercises: [{ name: "Overhead press", kind: "strength" }],
    });
    const plans = copyPlanFromPerson([markMonday], {
      personId: "mariel",
      fromPersonId: "mark",
      weekday: 1,
      weekStart: null,
    });
    const copied = planForWeekday(plans, "mariel", 1);
    expect(copied?.mirrorFrom).toBeNull();
    expect(copied?.title).toBe("Push");
    expect(copied?.exercises[0].name).toBe("Overhead press");
  });
});
