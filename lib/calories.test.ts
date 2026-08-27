import { describe, expect, it } from "vitest";
import {
  caloriesFromMet,
  caloriesFromSteps,
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
    cardio.cardio = { minutes: 30, distanceMiles: 2.5, steps: null, intensity: "moderate" };
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

  it("uses basketball-specific METs and prefers longer name matches", () => {
    expect(metForCardio("Basketball training", "moderate")).toBe(6.5);
    expect(metForCardio("Basketball game", "hard")).toBe(10);
    expect(metForCardio("Pickup basketball game", "moderate")).toBe(8);
    expect(metForCardio("Morning basketball", "easy")).toBe(5);
  });

  it("estimates calories from steps when minutes are not set", () => {
    const walking = createExercise("Walking", "cardio");
    walking.cardio = { minutes: 0, distanceMiles: null, steps: 4000, intensity: "moderate" };
    expect(caloriesFromSteps(4000, 160)).toBe(160);
    expect(estimateExerciseCalories(walking, 160)).toBe(160);
  });

  it("uses minutes for calories even when steps are also logged", () => {
    const game = createExercise("Basketball game", "cardio");
    game.cardio = { minutes: 40, distanceMiles: null, steps: 8000, intensity: "moderate" };
    expect(estimateExerciseCalories(game, 160)).toBeCloseTo(caloriesFromMet(8, 160, 40), 4);
  });
});
