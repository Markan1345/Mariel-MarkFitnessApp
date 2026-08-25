import { describe, expect, it } from "vitest";
import { searchExercises, WORKOUT_TEMPLATES } from "@/lib/exercises";
import {
  formatDuration,
  greeting,
  lastSevenDays,
  startOfLocalDay,
  workoutsThisWeek,
} from "@/lib/stats";
import { createWorkout, finishWorkout } from "@/lib/store";

describe("stats", () => {
  it("formats durations under and over an hour", () => {
    expect(formatDuration("2026-08-25T10:00:00.000Z", "2026-08-25T10:07:05.000Z")).toBe("7:05");
    expect(formatDuration("2026-08-25T10:00:00.000Z", "2026-08-25T11:08:09.000Z")).toBe(
      "1:08:09",
    );
  });

  it("greets based on time of day", () => {
    expect(greeting("Mark", new Date("2026-08-25T08:00:00"))).toBe("Good morning, Mark");
    expect(greeting("Mariel", new Date("2026-08-25T15:00:00"))).toBe("Good afternoon, Mariel");
    expect(greeting("Mark", new Date("2026-08-25T20:00:00"))).toBe("Good evening, Mark");
  });

  it("counts workouts in the current week and last seven days", () => {
    const now = new Date("2026-08-25T12:00:00");
    const monday = createWorkout({
      personId: "mark",
      title: "Push",
      startedAt: "2026-08-24T18:00:00.000Z",
    });
    const lastWeek = finishWorkout(
      createWorkout({
        personId: "mark",
        title: "Old",
        startedAt: "2026-08-16T18:00:00.000Z",
      }),
      "2026-08-16T19:00:00.000Z",
    );
    const finishedMonday = finishWorkout(monday, "2026-08-24T19:00:00.000Z");
    const week = workoutsThisWeek([finishedMonday, lastWeek], now);
    expect(week.map((workout) => workout.title)).toEqual(["Push"]);

    const days = lastSevenDays([finishedMonday], now);
    expect(days).toHaveLength(7);
    expect(days[0].date.getTime()).toBe(startOfLocalDay(new Date("2026-08-19T12:00:00")).getTime());
    expect(days.some((day) => day.trained)).toBe(true);
  });
});

describe("exercises", () => {
  it("searches the library and keeps starter templates", () => {
    expect(searchExercises("bench").map((item) => item.name)).toContain("Barbell bench press");
    expect(WORKOUT_TEMPLATES.map((item) => item.id)).toEqual(
      expect.arrayContaining(["push", "pull", "legs"]),
    );
  });
});
