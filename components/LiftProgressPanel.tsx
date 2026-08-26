"use client";

import { useEffect, useMemo, useState } from "react";
import { LiftChart } from "@/components/LiftChart";
import {
  liftHistoryForExercise,
  liftTrend,
  trackedExercises,
  type LastLift,
} from "@/lib/progression";
import { formatDateLabel } from "@/lib/stats";
import type { PersonId, Workout } from "@/lib/types";

export function LiftProgressPanel({
  workouts,
  personId,
}: {
  workouts: Workout[];
  personId: PersonId;
}) {
  const tracked = useMemo(() => trackedExercises(workouts, personId), [workouts, personId]);
  const [selected, setSelected] = useState(tracked[0]?.name ?? "");

  useEffect(() => {
    if (!tracked.some((item) => item.name === selected)) {
      setSelected(tracked[0]?.name ?? "");
    }
  }, [tracked, selected]);

  const history = useMemo(
    () => (selected ? liftHistoryForExercise(workouts, personId, selected) : []),
    [workouts, personId, selected],
  );
  const chartPoints = useMemo(() => history.slice(-30), [history]);
  const trend = liftTrend(history);

  if (tracked.length === 0) {
    return (
      <section className="surface-card p-4">
        <p className="eyebrow">Lift progress</p>
        <h2 className="font-display mt-1 text-3xl leading-none">No lifts logged yet</h2>
        <p className="mt-3 text-sm text-muted">
          Finish strength workouts with completed sets and the charts will show up here.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="surface-card lift-card p-4">
        <p className="eyebrow">Exercise trend</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tracked.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setSelected(item.name)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                selected === item.name ? "accent-bg text-paper" : "bg-bg text-muted"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
        <p className="font-display mt-4 text-5xl leading-none">
          {trend.current ? `${trend.current.weight}` : "—"}
          <span className="ml-2 text-2xl text-muted">lb</span>
        </p>
        <p className="mt-2 text-sm font-medium text-muted">
          {selected}
          {trend.current
            ? ` · ${formatDateLabel(trend.current.liftedAt)} · ${trend.current.reps} reps`
            : ""}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <TrendStat label="Last log" value={formatDelta(trend.delta)} />
          <TrendStat label="7 days" value={formatDelta(trend.weekDelta)} />
          <TrendStat label="30 days" value={formatDelta(trend.monthDelta)} />
        </div>
        <div className="mt-4">
          <LiftChart points={chartPoints} label={`${selected} lift weight trend`} />
        </div>
      </section>

      <section className="mt-6">
        <p className="eyebrow">History</p>
        <h2 className="font-display text-2xl">{selected} sessions</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No completed sets for this lift yet.</p>
        ) : (
          <div className="mt-3 grid gap-2">
            {[...history].reverse().map((lift) => (
              <LiftHistoryRow key={`${lift.workoutId}-${lift.liftedAt}`} lift={lift} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <p className="eyebrow">All lifts</p>
        <h2 className="font-display text-2xl">Every exercise chart</h2>
        <div className="mt-3 grid gap-3">
          {tracked.map((item) => {
            const series = liftHistoryForExercise(workouts, personId, item.name).slice(-30);
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setSelected(item.name)}
                className="surface-card p-4 text-left"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl leading-tight">{item.name}</h3>
                  <p className="shrink-0 text-sm font-extrabold">
                    {item.last.weight} lb
                  </p>
                </div>
                <p className="mt-1 text-xs font-bold text-muted">
                  {item.sessions} session{item.sessions === 1 ? "" : "s"} ·{" "}
                  {formatDateLabel(item.last.liftedAt)}
                </p>
                <div className="mt-2">
                  <LiftChart points={series} label={`${item.name} trend`} />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

function LiftHistoryRow({ lift }: { lift: LastLift }) {
  return (
    <div className="surface-card flex items-center justify-between px-4 py-3">
      <div>
        <p className="font-medium">{formatDateLabel(lift.liftedAt)}</p>
        <p className="text-sm text-muted">{lift.workoutTitle}</p>
      </div>
      <p className="text-sm font-extrabold">
        {lift.weight} lb × {lift.reps}
      </p>
    </div>
  );
}

function TrendStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bg px-2 py-3">
      <p className="font-bold text-muted">{label}</p>
      <p className="mt-1 text-sm font-extrabold">{value}</p>
    </div>
  );
}

function formatDelta(value: number | null): string {
  if (value === null) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)} lb`;
}
