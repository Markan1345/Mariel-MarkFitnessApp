import { describe, expect, it } from "vitest";
import { createExercise, createWorkout, emptyState, parseState } from "@/lib/store";
import {
  addStepEntry,
  averageDailySteps,
  createStepLog,
  dailyStepTotal,
  LIVE_STEP_ENTRY_LABEL,
  phoneStepsForDay,
  removeStepEntry,
  stepHistory,
  stepHistoryForMonth,
  stepsThisMonth,
  stepsThisWeek,
  updateStepEntry,
  upsertLabeledStepEntry,
  workoutStepsForDay,
} from "@/lib/steps";

describe("daily steps", () => {
  it("sums phone logs and workout cardio steps for a day", () => {
    const workout = createWorkout({
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

  it("adds multiple phone entries for the same day", () => {
    let logs = addStepEntry([], {
      personId: "mark",
      date: "2026-08-27",
      steps: 2000,
      label: "Morning",
    });
    logs = addStepEntry(logs, {
      personId: "mark",
      date: "2026-08-27",
      steps: 1500,
      label: "Afternoon",
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].entries).toHaveLength(2);
    expect(phoneStepsForDay(logs, "mark", "2026-08-27")).toBe(3500);
  });

  it("updates and removes individual entries", () => {
    let logs = addStepEntry([], { personId: "mark", date: "2026-08-27", steps: 1000 });
    const entryId = logs[0].entries[0].id;
    logs = updateStepEntry(logs, {
      personId: "mark",
      date: "2026-08-27",
      entryId,
      steps: 2500,
    });
    expect(phoneStepsForDay(logs, "mark", "2026-08-27")).toBe(2500);
    logs = removeStepEntry(logs, { personId: "mark", date: "2026-08-27", entryId });
    expect(logs).toHaveLength(0);
  });

  it("upserts a labeled entry such as the live counter", () => {
    let logs = addStepEntry([], { personId: "mark", date: "2026-08-27", steps: 500, label: "Walk" });
    logs = upsertLabeledStepEntry(logs, {
      personId: "mark",
      date: "2026-08-27",
      label: LIVE_STEP_ENTRY_LABEL,
      steps: 120,
    });
    logs = upsertLabeledStepEntry(logs, {
      personId: "mark",
      date: "2026-08-27",
      label: LIVE_STEP_ENTRY_LABEL,
      steps: 340,
    });
    expect(logs[0].entries).toHaveLength(2);
    expect(phoneStepsForDay(logs, "mark", "2026-08-27")).toBe(840);
  });

  it("migrates legacy phoneSteps logs when parsing state", () => {
    const raw = JSON.stringify({
      version: 2,
      workouts: [],
      plans: [],
      weights: [],
      stepLogs: [
        {
          id: "st_legacy",
          personId: "mark",
          date: "2026-08-27",
          phoneSteps: 4321,
          updatedAt: "2026-08-27T12:00:00.000Z",
        },
      ],
    });
    const state = parseState(raw);
    expect(state.stepLogs[0].entries).toHaveLength(1);
    expect(state.stepLogs[0].entries[0].steps).toBe(4321);
    expect(phoneStepsForDay(state.stepLogs, "mark", "2026-08-27")).toBe(4321);
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

  it("estimates pickup-game steps when minutes are logged without a step count", () => {
    const workout = createWorkout({
      personId: "mark",
      title: "Pickup",
      exerciseNames: ["Basketball pickup"],
      startedAt: "2026-08-12T18:00:00",
    });
    workout.exercises[0].cardio = {
      minutes: 40,
      distanceMiles: null,
      steps: null,
      intensity: "moderate",
    };
    const state = { ...emptyState(), workouts: [workout] };
    expect(workoutStepsForDay(state.workouts, "mark", "2026-08-12")).toBe(40 * 135);
    expect(dailyStepTotal(state, "mark", "2026-08-12").total).toBe(5400);
  });

  it("totals this calendar month and averages days so far", () => {
    const now = new Date(2026, 7, 12);
    const state = {
      ...emptyState(),
      stepLogs: [
        createStepLog({ personId: "mark", date: "2026-07-31", phoneSteps: 9999 }),
        createStepLog({ personId: "mark", date: "2026-08-01", phoneSteps: 3000 }),
        createStepLog({ personId: "mark", date: "2026-08-12", phoneSteps: 1500 }),
      ],
    };
    expect(stepsThisMonth(state, "mark", now)).toBe(4500);
    const month = stepHistoryForMonth(state, "mark", now);
    expect(month).toHaveLength(31);
    expect(averageDailySteps(month, now)).toBe(Math.round(4500 / 12));
  });
});
