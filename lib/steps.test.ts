import { describe, expect, it } from "vitest";
import { createExercise, createWorkout, emptyState } from "@/lib/store";
import {
  createStepLog,
  dailyStepTotal,
  stepHistory,
  stepsThisWeek,
  upsertStepLog,
  workoutStepsForDay,
} from "@/lib/steps";

describe("daily steps", () => {
  it("sums phone logs and workout cardio steps for a day", () => {
    let workout = createWorkout({
      personId: "mark",
      title: "Hoops",
      exerciseNames: ["Basketball game"],
      startedAt: "2026-08-27T12:00:00",
    });
    workout.exercises[0].cardio = {
      minutes: 40,
      distanceMiles: null,
      steps: 8000,
      intensity: "hard",
    };
    const logs = [
      createStepLog({ personId: "mark", date: "2026-08-27", phoneSteps: 4200 }),
      createStepLog({ personId: "mariel", date: "2026-08-27", phoneSteps: 9000 }),
    ];
    const state = { ...emptyState(), workouts: [workout], stepLogs: logs };
    const mark = dailyStepTotal(state, "mark", "2026-08-27");
    expect(mark.phoneSteps).toBe(4200);
    expect(mark.workoutSteps).toBe(8000);
    expect(mark.total).toBe(12200);
    expect(workoutStepsForDay(state.workouts, "mariel", "2026-08-27")).toBe(0);
    expect(dailyStepTotal(state, "mariel", "2026-08-27").total).toBe(9000);
  });

  it("replaces the same person and date when upserting", () => {
    const first = createStepLog({ personId: "mark", date: "2026-08-27", phoneSteps: 1000 });
    const next = { ...first, phoneSteps: 2500, id: "st_other" };
    const logs = upsertStepLog(upsertStepLog([], first), next);
    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe(first.id);
    expect(logs[0].phoneSteps).toBe(2500);
  });

  it("totals this week from Monday through Sunday", () => {
    const thursday = new Date(2026, 7, 27); // Thursday Aug 27 2026
    const state = {
      ...emptyState(),
      stepLogs: [
        createStepLog({ personId: "mark", date: "2026-08-24", phoneSteps: 1000 }), // Mon
        createStepLog({ personId: "mark", date: "2026-08-27", phoneSteps: 2000 }), // Thu
        createStepLog({ personId: "mark", date: "2026-08-23", phoneSteps: 9999 }), // previous Sun
      ],
    };
    expect(stepsThisWeek(state, "mark", thursday)).toBe(3000);
  });

  it("builds a day-by-day history including empty days", () => {
    const now = new Date(2026, 7, 27);
    const workout = createWorkout({
      personId: "mark",
      title: "Walk",
      exerciseNames: ["Walking"],
      startedAt: "2026-08-26T12:00:00",
    });
    const walk = createExercise("Walking", "cardio");
    walk.cardio = { minutes: 20, distanceMiles: null, steps: 3000, intensity: "easy" };
    workout.exercises = [walk];
    const history = stepHistory(
      {
        ...emptyState(),
        workouts: [workout],
        stepLogs: [createStepLog({ personId: "mark", date: "2026-08-27", phoneSteps: 5000 })],
      },
      "mark",
      3,
      now,
    );
    expect(history.map((day) => day.date)).toEqual(["2026-08-25", "2026-08-26", "2026-08-27"]);
    expect(history.map((day) => day.total)).toEqual([0, 3000, 5000]);
  });
});
