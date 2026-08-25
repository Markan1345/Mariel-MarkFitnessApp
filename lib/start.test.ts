import { describe, expect, it } from "vitest";
import { WORKOUT_TEMPLATES } from "@/lib/exercises";
import { defaultStartChoices, workoutFromChoice } from "@/lib/start";
import { createWorkout } from "@/lib/store";

describe("workoutFromChoice", () => {
  it("starts empty, from a template, or by repeating a prior session", () => {
    const empty = workoutFromChoice("mark", { type: "empty" });
    expect(empty.personId).toBe("mark");
    expect(empty.exercises).toEqual([]);

    const push = WORKOUT_TEMPLATES.find((item) => item.id === "push");
    expect(push).toBeTruthy();
    const templated = workoutFromChoice("mariel", { type: "template", template: push! });
    expect(templated.personId).toBe("mariel");
    expect(templated.title).toBe("Push day");
    expect(templated.exercises.map((exercise) => exercise.name)).toEqual(push!.exercises);

    const prior = createWorkout({
      personId: "mark",
      title: "Custom pull",
      exerciseNames: ["Pull-up"],
    });
    prior.exercises[0].sets[0].weight = 0;
    prior.exercises[0].sets[0].reps = 8;
    const repeated = workoutFromChoice("mark", { type: "repeat", workout: prior });
    expect(repeated.id).not.toBe(prior.id);
    expect(repeated.title).toBe("Custom pull");
    expect(repeated.exercises[0].name).toBe("Pull-up");
    expect(repeated.finishedAt).toBeNull();

    const fromPlan = workoutFromChoice("mariel", {
      type: "plan",
      plan: {
        id: "plan_1",
        personId: "mariel",
        title: "Tuesday custom",
        weekday: 2,
        source: "custom",
        createdAt: "2026-08-25T00:00:00.000Z",
        exercises: [
          { name: "Goblet squat", kind: "strength" },
          { name: "Treadmill", kind: "cardio" },
        ],
      },
    });
    expect(fromPlan.title).toBe("Tuesday custom");
    expect(fromPlan.exercises.map((item) => item.kind)).toEqual(["strength", "cardio"]);
  });

  it("defaults each person to today's custom plan when one exists", () => {
    const tuesday = new Date("2026-08-25T12:00:00");
    const marielPlan = {
      id: "plan_1",
      personId: "mariel" as const,
      title: "Tuesday custom",
      weekday: 2 as const,
      source: "custom" as const,
      createdAt: "2026-08-25T00:00:00.000Z",
      exercises: [{ name: "Treadmill", kind: "cardio" as const }],
    };
    const choices = defaultStartChoices([marielPlan], tuesday);
    expect(choices.mariel).toEqual({ type: "plan", plan: marielPlan });
    expect(choices.mark).toEqual({ type: "empty" });
    expect(workoutFromChoice("mariel", choices.mariel).exercises[0].name).toBe("Treadmill");
  });
});
