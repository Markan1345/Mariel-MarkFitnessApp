import { describe, expect, it } from "vitest";
import { indexFromPointerY, reorderList } from "@/lib/reorder";
import { createWorkout, moveExercise } from "@/lib/store";

describe("reorderList", () => {
  it("moves items within a list", () => {
    expect(reorderList(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(reorderList(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(reorderList(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
    expect(reorderList(["a", "b", "c"], -1, 1)).toEqual(["a", "b", "c"]);
  });

  it("reorders exercises on a workout", () => {
    const workout = createWorkout({
      personId: "mark",
      title: "Mixed",
      exerciseNames: ["Barbell bench press", "Back squat", "Treadmill"],
    });
    const moved = moveExercise(workout, 0, 2);
    expect(moved.exercises.map((exercise) => exercise.name)).toEqual([
      "Back squat",
      "Treadmill",
      "Barbell bench press",
    ]);
  });
});

describe("indexFromPointerY", () => {
  it("picks the row whose midpoint the pointer crossed", () => {
    const tops = [100, 200, 300];
    const heights = [80, 80, 80];
    expect(indexFromPointerY(120, tops, heights)).toBe(0);
    expect(indexFromPointerY(230, tops, heights)).toBe(1);
    expect(indexFromPointerY(360, tops, heights)).toBe(2);
  });
});
