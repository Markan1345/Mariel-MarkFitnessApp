import { describe, expect, it } from "vitest";
import {
  datesInWeek,
  formatWeekRange,
  localDateKey,
  nextWeekStart,
  startOfWeek,
  weekStartKey,
} from "@/lib/weekdays";

describe("weekdays", () => {
  it("treats weeks as Monday through Sunday", () => {
    const tuesday = new Date("2026-08-25T12:00:00");
    expect(weekStartKey(tuesday)).toBe("2026-08-24");
    expect(localDateKey(nextWeekStart(tuesday))).toBe("2026-08-31");
    expect(datesInWeek(startOfWeek(tuesday)).map(localDateKey)).toEqual([
      "2026-08-24",
      "2026-08-25",
      "2026-08-26",
      "2026-08-27",
      "2026-08-28",
      "2026-08-29",
      "2026-08-30",
    ]);
    expect(formatWeekRange(nextWeekStart(tuesday))).toContain("31");
  });
});
