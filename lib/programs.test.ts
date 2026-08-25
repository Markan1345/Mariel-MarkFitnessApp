import { describe, expect, it } from "vitest";
import {
  importProgram,
  parseImportedProgram,
  planForWeekday,
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
});
