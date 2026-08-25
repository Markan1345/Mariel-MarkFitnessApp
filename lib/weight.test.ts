import { describe, expect, it } from "vitest";
import { createWeightEntry, latestWeight, upsertWeight, weightTrend } from "@/lib/weight";

describe("weight", () => {
  it("keeps one entry per person per date and reports trend", () => {
    const first = createWeightEntry({ personId: "mark", date: "2026-07-20", pounds: 185 });
    const second = createWeightEntry({ personId: "mark", date: "2026-08-20", pounds: 182.4 });
    const updatedFirst = createWeightEntry({ personId: "mark", date: "2026-07-20", pounds: 184.8 });
    let entries = upsertWeight([], first);
    entries = upsertWeight(entries, second);
    entries = upsertWeight(entries, updatedFirst);
    expect(entries).toHaveLength(2);
    expect(latestWeight(entries, "mark")?.pounds).toBe(182.4);

    const trend = weightTrend(entries, "mark", new Date("2026-08-25T12:00:00"));
    expect(trend.current?.pounds).toBe(182.4);
    expect(trend.delta).toBe(-2.4);
    expect(trend.monthDelta).toBe(-2.4);
  });
});
