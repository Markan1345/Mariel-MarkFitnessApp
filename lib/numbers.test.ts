import { describe, expect, it } from "vitest";
import { isDayKey, parseDecimalInput, shiftDayKey } from "@/lib/numbers";

describe("parseDecimalInput", () => {
  it("keeps a trailing decimal so tenths can be typed", () => {
    expect(parseDecimalInput("181.")).toEqual({ text: "181.", value: 181 });
    expect(parseDecimalInput("181.8")).toEqual({ text: "181.8", value: 181.8 });
    expect(parseDecimalInput("2.5")).toEqual({ text: "2.5", value: 2.5 });
    expect(parseDecimalInput("")).toEqual({ text: "", value: null });
  });
});

describe("isDayKey", () => {
  it("accepts ISO calendar days and rejects junk", () => {
    expect(isDayKey("2026-07-20")).toBe(true);
    expect(isDayKey("2026-13-01")).toBe(false);
    expect(isDayKey("07/20/2026")).toBe(false);
    expect(shiftDayKey("2026-08-25", -30)).toBe("2026-07-26");
  });
});
