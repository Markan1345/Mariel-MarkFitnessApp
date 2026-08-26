import { describe, expect, it } from "vitest";
import { createWorkout, finishWorkout, updateSet } from "@/lib/store";
import {
  exerciseNamesMatch,
  formatLastLift,
  lastLiftForExercise,
  lastLiftsForPlan,
  liftHistoryForExercise,
  liftTrend,
  trackedExercises,
} from "@/lib/progression";

describe("progression", () => {
  it("matches exercise names case-insensitively", () => {
    expect(exerciseNamesMatch("Back squat", "back squat")).toBe(true);
    expect(exerciseNamesMatch(" Back squat ", "Back Squat")).toBe(true);
  });

  it("returns the most recent heaviest logged set for an exercise", () => {
    let older = createWorkout({
      personId: "mark",
      title: "5x5 A",
      exerciseNames: ["Back squat", "Barbell bench press"],
    });
    older = updateSet(older, older.exercises[0].id, older.exercises[0].sets[0].id, (set) => ({
      ...set,
      weight: 185,
      reps: 5,
      completed: true,
    }));
    older = finishWorkout(older, "2026-08-18T12:00:00.000Z");

    let newer = createWorkout({
      personId: "mark",
      title: "5x5 A",
      exerciseNames: ["Back squat"],
    });
    newer = updateSet(newer, newer.exercises[0].id, newer.exercises[0].sets[0].id, (set) => ({
      ...set,
      weight: 190,
      reps: 5,
      completed: true,
    }));
    newer = finishWorkout(newer, "2026-08-25T12:00:00.000Z");

    const last = lastLiftForExercise([older, newer], "mark", "Back squat");
    expect(last?.weight).toBe(190);
    expect(last?.reps).toBe(5);
    expect(last?.liftedAt).toBe("2026-08-25T12:00:00.000Z");
    expect(formatLastLift(last!)).toContain("190 lb × 5");
  });

  it("scopes lifts by person and ignores unfinished workouts", () => {
    let marielWorkout = createWorkout({
      personId: "mariel",
      title: "Leg day",
      exerciseNames: ["Back squat"],
    });
    marielWorkout = updateSet(
      marielWorkout,
      marielWorkout.exercises[0].id,
      marielWorkout.exercises[0].sets[0].id,
      (set) => ({ ...set, weight: 135, reps: 5, completed: true }),
    );
    marielWorkout = finishWorkout(marielWorkout, "2026-08-20T12:00:00.000Z");

    const markLive = createWorkout({
      personId: "mark",
      title: "Leg day",
      exerciseNames: ["Back squat"],
    });

    expect(lastLiftForExercise([marielWorkout, markLive], "mark", "Back squat")).toBeNull();
    expect(lastLiftForExercise([marielWorkout, markLive], "mariel", "Back squat")?.weight).toBe(135);
  });

  it("excludes the active workout and reports plan progression", () => {
    let finished = createWorkout({
      personId: "mark",
      title: "5x5 A",
      exerciseNames: ["Overhead press"],
    });
    finished = updateSet(
      finished,
      finished.exercises[0].id,
      finished.exercises[0].sets[0].id,
      (set) => ({ ...set, weight: 95, reps: 5, completed: true }),
    );
    finished = finishWorkout(finished, "2026-08-20T12:00:00.000Z");

    const active = createWorkout({
      personId: "mark",
      title: "5x5 B",
      exerciseNames: ["Overhead press", "Deadlift"],
    });

    const progression = lastLiftsForPlan(
      [finished, active],
      "mark",
      [
        { name: "Overhead press", kind: "strength" },
        { name: "Deadlift", kind: "strength" },
        { name: "Walking", kind: "cardio" },
      ],
      { excludeWorkoutId: active.id },
    );

    expect(progression).toHaveLength(2);
    expect(progression[0].last?.weight).toBe(95);
    expect(progression[1].last).toBeNull();
  });

  it("uses the heaviest completed set within a workout", () => {
    let workout = createWorkout({
      personId: "mariel",
      title: "Push",
      exerciseNames: ["Barbell bench press"],
    });
    const exercise = workout.exercises[0];
    workout = updateSet(workout, exercise.id, exercise.sets[0].id, (set) => ({
      ...set,
      weight: 95,
      reps: 8,
      completed: true,
    }));
    workout = {
      ...workout,
      exercises: [
        {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              id: "set-2",
              reps: 5,
              weight: 105,
              completed: true,
            },
          ],
        },
      ],
    };
    workout = finishWorkout(workout, "2026-08-22T12:00:00.000Z");

    expect(lastLiftForExercise([workout], "mariel", "Barbell bench press")?.weight).toBe(105);
  });

  it("builds chronological lift history and trend deltas", () => {
    const sessions = [
      { at: "2026-07-20T12:00:00.000Z", weight: 175 },
      { at: "2026-08-10T12:00:00.000Z", weight: 180 },
      { at: "2026-08-24T12:00:00.000Z", weight: 185 },
    ].map(({ at, weight }) => {
      let workout = createWorkout({
        personId: "mark",
        title: "5x5 A",
        exerciseNames: ["Back squat"],
      });
      workout = updateSet(workout, workout.exercises[0].id, workout.exercises[0].sets[0].id, (set) => ({
        ...set,
        weight,
        reps: 5,
        completed: true,
      }));
      return finishWorkout(workout, at);
    });

    const history = liftHistoryForExercise(sessions, "mark", "Back squat");
    expect(history.map((lift) => lift.weight)).toEqual([175, 180, 185]);

    const tracked = trackedExercises(sessions, "mark");
    expect(tracked).toHaveLength(1);
    expect(tracked[0].sessions).toBe(3);
    expect(tracked[0].last.weight).toBe(185);

    const trend = liftTrend(history, new Date("2026-08-25T12:00:00"));
    expect(trend.delta).toBe(5);
    expect(trend.monthDelta).toBe(10);
  });
});
