import { describe, expect, it } from "vitest";
import { emptyPeakState, magnitude, stepFromMagnitude } from "@/lib/pedometer";

describe("pedometer", () => {
  it("counts a gravity-based peak then waits for a valley", () => {
    let state = emptyPeakState(0, true);
    const rest = stepFromMagnitude(state, 9.8, 100);
    expect(rest.stepped).toBe(false);
    state = rest.state;
    const peak = stepFromMagnitude(state, 12.4, 500);
    expect(peak.stepped).toBe(true);
    const bounce = stepFromMagnitude(peak.state, 12.6, 600);
    expect(bounce.stepped).toBe(false);
    const valley = stepFromMagnitude(bounce.state, 9.4, 800);
    expect(valley.stepped).toBe(false);
    const next = stepFromMagnitude(valley.state, 12.2, 1200);
    expect(next.stepped).toBe(true);
  });

  it("ignores peaks that arrive too quickly", () => {
    const peaked = stepFromMagnitude(emptyPeakState(0, true), 12, 1000);
    expect(peaked.stepped).toBe(true);
    const valley = stepFromMagnitude(peaked.state, 9.4, 1100);
    const tooSoon = stepFromMagnitude(valley.state, 12.1, 1200);
    expect(tooSoon.stepped).toBe(false);
  });

  it("computes acceleration magnitude", () => {
    expect(magnitude(3, 4, 0)).toBe(5);
  });
});
