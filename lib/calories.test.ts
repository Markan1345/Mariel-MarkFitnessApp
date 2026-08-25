import { describe, expect, it } from "vitest";
import {
  caloriesFromMet,
  estimateExerciseCalories,
  estimateWorkoutCalories,
  metForCardio,
} from "@/lib/calories";
import { createExercise, createWorkout, updateSet } from "@/lib/store";

describe("calories", () => {
  it("uses MET x kg x hours", () => {
    const kcal = caloriesFromMet(7, 160, 30);
    expect(kcal).toBeCloseTo(7 * 72.5747792 * 0.5, 4);
  });

  it("estimates treadmill cardio and completed lifting sets", () => {
    const cardio = createExercise("Treadmill", "cardio");
    cardio.cardio = { minutes: 30, distanceMiles: 2.5, intensity: "moderate" };
    const cardioKcal = estimateExerciseCalories(cardio, 160);
    expect(metForCardio("Treadmill", "moderate")).toBe(7);
    expect(cardioKcal).toBeCloseTo(caloriesFromMet(7, 160, 30), 4);

    let lift = createWorkout({
      personId: "mark",
      title: "Push",
      exerciseNames: ["Barbell bench press"],
    });
    lift = updateSet(lift, lift.exercises[0].id, lift.exercises[0].sets[0].id, (set) => ({
      ...set,
      completed: true,
    }));
    const total = estimateWorkoutCalories(lift, 160);
    expect(total).toBe(Math.round(caloriesFromMet(6, 160, 2.5)));
  });
});
