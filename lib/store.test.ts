import { describe, expect, it } from "vitest";
import {
  addExercise,
  addSet,
  completedSetCount,
  createWorkout,
  createPairedWorkouts,
  deleteWorkout,
  duplicateWorkout,
  emptyState,
  finishWorkout,
  linkWorkouts,
  parseState,
  updateSet,
  upsertWorkout,
} from "@/lib/store";

describe("store", () => {
  it("parses empty or invalid storage as a blank state", () => {
    expect(parseState(null)).toEqual(emptyState());
    expect(parseState("not-json")).toEqual(emptyState());
    expect(parseState(JSON.stringify({ version: 9 }))).toEqual(emptyState());
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

  it("pairs two independent workouts so they can be logged together", () => {
    const { mark, mariel } = createPairedWorkouts({
      mark: { title: "Push day", exerciseNames: ["Barbell bench press"] },
      mariel: { title: "Leg day", exerciseNames: ["Back squat"] },
    });
    expect(mark.pairId).toBeTruthy();
    expect(mark.pairId).toBe(mariel.pairId);
    expect(mark.title).toBe("Push day");
    expect(mariel.title).toBe("Leg day");
    expect(mark.exercises[0].name).toBe("Barbell bench press");
    expect(mariel.exercises[0].name).toBe("Back squat");

    const [linkedA, linkedB] = linkWorkouts(
      createWorkout({ personId: "mark", title: "Cardio" }),
      createWorkout({ personId: "mariel", title: "Core" }),
    );
    expect(linkedA.pairId).toBe(linkedB.pairId);

    const parsed = parseState(
      JSON.stringify({
        version: 1,
        workouts: [{ ...mark, pairId: undefined }],
      }),
    );
    expect(parsed.version).toBe(2);
    expect(parsed.plans).toEqual([]);
    expect(parsed.weights).toEqual([]);
    expect(parsed.workouts[0].pairId).toBeNull();
    expect(parsed.workouts[0].exercises[0].kind).toBe("strength");
  });

  it("fills weekStart on older custom plans", () => {
    const parsed = parseState(
      JSON.stringify({
        version: 2,
        workouts: [],
        plans: [
          {
            id: "plan_old",
            personId: "mark",
            title: "Monday lift",
            weekday: 1,
            exercises: [{ name: "Back squat", kind: "strength" }],
            source: "custom",
            createdAt: "2026-08-25T00:00:00.000Z",
          },
        ],
        weights: [],
      }),
    );
    expect(parsed.plans[0].weekStart).toBeNull();
    expect(parsed.plans[0].title).toBe("Monday lift");
  });

  it("creates cardio entries without lifting sets", () => {
    const workout = createWorkout({
      personId: "mariel",
      title: "Cardio",
      exerciseNames: ["Treadmill"],
    });
    expect(workout.exercises[0].kind).toBe("cardio");
    expect(workout.exercises[0].sets).toEqual([]);
    expect(workout.exercises[0].cardio?.minutes).toBe(20);
  });
});
