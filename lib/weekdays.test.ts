import { describe, expect, it } from "vitest";
import {
  datesInMonth,
  datesInWeek,
  formatMonthLabel,
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

  it("lists every local day in the calendar month", () => {
    const august = new Date(2026, 7, 27);
    const days = datesInMonth(august).map(localDateKey);
    expect(days[0]).toBe("2026-08-01");
    expect(days.at(-1)).toBe("2026-08-31");
    expect(days).toHaveLength(31);
    expect(formatMonthLabel(august)).toContain("August");
  });
});
