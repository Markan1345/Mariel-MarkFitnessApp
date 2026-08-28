import { describe, expect, it } from "vitest";
import { createExercise } from "@/lib/store";
import {
  effectiveCardioSteps,
  estimatedCardioSteps,
  isEstimatedCardioSteps,
  stepsPerMinuteForCardio,
} from "@/lib/cardio-steps";

describe("cardio step estimates", () => {
  it("uses pickup-game rates and prefers the longest name match", () => {
    expect(stepsPerMinuteForCardio("Basketball pickup", "moderate")).toBe(135);
    expect(stepsPerMinuteForCardio("Pickup basketball game", "hard")).toBe(165);
    expect(stepsPerMinuteForCardio("Volleyball pickup", "moderate")).toBe(85);
    expect(stepsPerMinuteForCardio("Basketball game", "moderate")).toBe(140);
    expect(stepsPerMinuteForCardio("Basketball training", "moderate")).toBe(110);
  });

  it("estimates steps from minutes when none are logged", () => {
    const game = createExercise("Basketball pickup", "cardio");
    game.cardio = { minutes: 45, distanceMiles: null, steps: null, intensity: "moderate" };
    expect(estimatedCardioSteps(game)).toBe(45 * 135);
    expect(effectiveCardioSteps(game)).toBe(6075);
    expect(isEstimatedCardioSteps(game)).toBe(true);
  });

  it("keeps typed steps instead of adding the estimate on top", () => {
    const game = createExercise("Volleyball pickup", "cardio");
    game.cardio = { minutes: 60, distanceMiles: null, steps: 4200, intensity: "easy" };
    expect(estimatedCardioSteps(game)).toBe(60 * 65);
    expect(effectiveCardioSteps(game)).toBe(4200);
    expect(isEstimatedCardioSteps(game)).toBe(false);
  });

  it("does not invent steps for cycling or swimming", () => {
    const bike = createExercise("Stationary bike", "cardio");
    bike.cardio = { minutes: 30, distanceMiles: 8, steps: null, intensity: "moderate" };
    expect(effectiveCardioSteps(bike)).toBe(0);
    expect(isEstimatedCardioSteps(bike)).toBe(false);
  });
});
