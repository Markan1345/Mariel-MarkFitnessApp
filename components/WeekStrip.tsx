import { lastSevenDays } from "@/lib/stats";
import type { CustomPlan, PersonId, Workout } from "@/lib/types";

export function WeekStrip({
  workouts,
  plans,
  personId,
}: {
  workouts: Workout[];
  plans?: CustomPlan[];
  personId?: PersonId;
}) {
  const days = lastSevenDays(workouts, { plans, personId });

  return (
    <div className="relative z-10 grid grid-cols-7 gap-1.5 rounded-2xl bg-bg/75 p-2">
      {days.map(({ date, trained, rest }) => (
        <div key={date.toISOString()} className="text-center">
          <p className="text-[9px] font-extrabold tracking-wider text-muted uppercase" suppressHydrationWarning>
            {date.toLocaleDateString(undefined, { weekday: "narrow" })}
          </p>
          <div
            className={`mx-auto mt-1 grid h-8 w-8 place-items-center rounded-xl text-xs font-extrabold ${
              trained
                ? "accent-bg text-paper shadow-sm"
                : rest
                  ? "border border-energy/40 bg-energy/10 text-energy"
                  : "bg-paper text-muted"
            }`}
            title={trained ? "Trained" : rest ? "Rest day" : undefined}
            suppressHydrationWarning
          >
            {date.getDate()}
          </div>
        </div>
      ))}
    </div>
  );
}
