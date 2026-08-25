import { describe, expect, it } from "vitest";
import { WORKOUT_TEMPLATES } from "@/lib/exercises";
import { workoutFromChoice } from "@/lib/start";
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
  });
});
