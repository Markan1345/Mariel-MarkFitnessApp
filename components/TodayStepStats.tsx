import Link from "next/link";
import { StepBars } from "@/components/StepBars";
import { formatSteps } from "@/lib/store";
import { stepHistory, stepsThisMonth, stepsThisWeek, todayStepTotal } from "@/lib/steps";
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
  const month = stepsThisMonth(state, personId);
  const days = stepHistory(state, personId, 7);

  return (
    <Link href="/steps" className="relative z-10 mt-3 block">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-bg px-3 py-2.5">
          <p className="text-[10px] font-bold tracking-wide text-muted uppercase">Today</p>
          <p className="font-display mt-1 text-xl leading-none">{today.total.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] font-medium text-muted">steps</p>
        </div>
        <div className="rounded-2xl bg-bg px-3 py-2.5">
          <p className="text-[10px] font-bold tracking-wide text-muted uppercase">Week</p>
          <p className="font-display mt-1 text-xl leading-none">{week.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] font-medium text-muted">steps</p>
        </div>
        <div className="rounded-2xl bg-bg px-3 py-2.5">
          <p className="text-[10px] font-bold tracking-wide text-muted uppercase">Month</p>
          <p className="font-display mt-1 text-xl leading-none">{month.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] font-medium text-muted">steps</p>
        </div>
      </div>
      <div className="mt-3">
        <StepBars days={days} />
      </div>
      {today.phoneSteps > 0 || today.workoutSteps > 0 ? (
        <p className="mt-2 text-[10px] font-medium text-muted">
          {today.phoneSteps > 0 ? `${formatSteps(today.phoneSteps)} phone` : ""}
          {today.phoneSteps > 0 && today.workoutSteps > 0 ? " · " : ""}
          {today.workoutSteps > 0 ? `${formatSteps(today.workoutSteps)} workouts` : ""}
        </p>
      ) : (
        <p className="mt-2 text-[10px] font-medium text-muted">
          Track phone steps or log a pickup game to fill today.
        </p>
      )}
    </Link>
  );
}
