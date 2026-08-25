import { describe, expect, it } from "vitest";
import {
  addExercise,
  addSet,
  completedSetCount,
  createWorkout,
  deleteWorkout,
  duplicateWorkout,
  emptyState,
  finishWorkout,
  parseState,
  updateSet,
  upsertWorkout,
} from "@/lib/store";

describe("store", () => {
  it("parses empty or invalid storage as a blank state", () => {
    expect(parseState(null)).toEqual(emptyState());
    expect(parseState("not-json")).toEqual(emptyState());
    expect(parseState(JSON.stringify({ version: 2 }))).toEqual(emptyState());
  });

  it("creates a workout from a template and tracks completed sets", () => {
    const workout = createWorkout({
      personId: "mariel",
      title: "Push day",
      exerciseNames: ["Barbell bench press"],
    });
    expect(workout.exercises).toHaveLength(1);
    expect(workout.exercises[0].sets).toHaveLength(1);
    expect(completedSetCount(workout)).toEqual({ done: 0, total: 1 });

    const withSetDone = updateSet(
      workout,
      workout.exercises[0].id,
      workout.exercises[0].sets[0].id,
      (set) => ({ ...set, completed: true }),
    );
    expect(completedSetCount(withSetDone)).toEqual({ done: 1, total: 1 });
  });

  it("adds sets by copying the previous weight and reps", () => {
    let workout = createWorkout({
      personId: "mark",
      title: "Legs",
      exerciseNames: ["Back squat"],
    });
    const exerciseId = workout.exercises[0].id;
    const firstSetId = workout.exercises[0].sets[0].id;
    workout = updateSet(workout, exerciseId, firstSetId, (set) => ({
      ...set,
      weight: 185,
      reps: 5,
    }));
    workout = addSet(workout, exerciseId);
    const last = workout.exercises[0].sets.at(-1);
    expect(last?.weight).toBe(185);
    expect(last?.reps).toBe(5);
    expect(last?.completed).toBe(false);
  });

  it("upserts, duplicates, finishes, and deletes workouts", () => {
    const original = createWorkout({ personId: "mark", title: "Pull day" });
    let state = upsertWorkout(emptyState(), original);
    expect(state.workouts).toHaveLength(1);

    const finished = finishWorkout(original, "2026-08-25T12:00:00.000Z");
    state = upsertWorkout(state, finished);
    expect(state.workouts[0].finishedAt).toBe("2026-08-25T12:00:00.000Z");

    const copy = duplicateWorkout(finished, "2026-08-25T13:00:00.000Z");
    expect(copy.id).not.toBe(finished.id);
    expect(copy.finishedAt).toBeNull();
    expect(copy.title).toBe("Pull day");

    const withExtra = addExercise(copy, "Face pull");
    expect(withExtra.exercises.map((exercise) => exercise.name)).toContain("Face pull");

    state = deleteWorkout(upsertWorkout(state, copy), copy.id);
    expect(state.workouts.map((workout) => workout.id)).toEqual([original.id]);
  });
});
