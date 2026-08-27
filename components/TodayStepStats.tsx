import Link from "next/link";
import { formatSteps } from "@/lib/store";
import { stepHistory, stepsThisWeek, todayStepTotal } from "@/lib/steps";
import type { AppState, PersonId } from "@/lib/types";

export function TodayStepStats({
  state,
  personId,
}: {
  state: AppState;
  personId: PersonId;
}) {
  const today = todayStepTotal(state, personId);
  const week = stepsThisWeek(state, personId);
  const days = stepHistory(state, personId, 7);
  const max = Math.max(1, ...days.map((day) => day.total));

  return (
    <Link href="/weight?tab=steps" className="relative z-10 mt-3 block">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-bg px-3 py-2.5">
          <p className="text-[10px] font-bold tracking-wide text-muted uppercase">Today</p>
          <p className="font-display mt-1 text-xl leading-none">{today.total.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] font-medium text-muted">steps</p>
        </div>
        <div className="rounded-2xl bg-bg px-3 py-2.5">
          <p className="text-[10px] font-bold tracking-wide text-muted uppercase">This week</p>
          <p className="font-display mt-1 text-xl leading-none">{week.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] font-medium text-muted">steps</p>
        </div>
      </div>
      <div className="mt-3 flex items-end gap-1">
        {days.map((day) => {
          const height = 8 + Math.round((day.total / max) * 28);
          const label = new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, {
            weekday: "narrow",
          });
          return (
            <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className={`w-full max-w-6 rounded-full ${day.total > 0 ? "accent-bg" : "bg-line"}`}
                style={{ height }}
                title={`${label}: ${formatSteps(day.total)}`}
              />
              <span className="text-[9px] font-bold text-muted">{label}</span>
            </div>
          );
        })}
      </div>
      {today.phoneSteps > 0 || today.workoutSteps > 0 ? (
        <p className="mt-2 text-[10px] font-medium text-muted">
          {today.phoneSteps > 0 ? `${formatSteps(today.phoneSteps)} phone` : ""}
          {today.phoneSteps > 0 && today.workoutSteps > 0 ? " · " : ""}
          {today.workoutSteps > 0 ? `${formatSteps(today.workoutSteps)} workouts` : ""}
        </p>
      ) : (
        <p className="mt-2 text-[10px] font-medium text-muted">
          Track phone steps or log cardio to fill today.
        </p>
      )}
    </Link>
  );
}
