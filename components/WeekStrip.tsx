import { lastSevenDays } from "@/lib/stats";
import type { Workout } from "@/lib/types";

export function WeekStrip({ workouts }: { workouts: Workout[] }) {
  const days = lastSevenDays(workouts);

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(({ date, trained }) => (
        <div key={date.toISOString()} className="text-center">
          <p className="text-[10px] tracking-wider text-muted uppercase" suppressHydrationWarning>
            {date.toLocaleDateString(undefined, { weekday: "narrow" })}
          </p>
          <div
            className={`mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full text-xs font-medium ${
              trained ? "accent-bg text-paper" : "bg-line/70 text-muted"
            }`}
            suppressHydrationWarning
          >
            {date.getDate()}
          </div>
        </div>
      ))}
    </div>
  );
}
