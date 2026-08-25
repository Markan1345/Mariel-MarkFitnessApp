"use client";

import { useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { AppIcon } from "@/components/AppIcon";
import { NumberStepper } from "@/components/NumberStepper";
import { PersonTabs } from "@/components/PersonTabs";
import { WeightChart } from "@/components/WeightChart";
import { PEOPLE } from "@/lib/people";
import { useFitnessStore } from "@/lib/use-fitness-store";
import { isDayKey, shiftDayKey } from "@/lib/numbers";
import { createWeightEntry, latestWeight, todayKey, upsertWeight, weightTrend, weightsForPerson } from "@/lib/weight";
import type { PersonId } from "@/lib/types";

export default function WeightPage() {
  const { state, patch } = useFitnessStore();
  const [personId, setPersonId] = useState<PersonId>("mark");
  const [pounds, setPounds] = useState<number | null>(null);
  const [date, setDate] = useState(todayKey());
  const entries = weightsForPerson(state.weights, personId);
  const trend = weightTrend(state.weights, personId);
  const chartEntries = useMemo(() => entries.slice(-30), [entries]);

  function save() {
    if (pounds === null || Number.isNaN(pounds) || pounds <= 0 || !isDayKey(date)) return;
    patch((current) => ({
      ...current,
      weights: upsertWeight(
        current.weights,
        createWeightEntry({ personId, date, pounds: Math.round(pounds * 10) / 10 }),
      ),
    }));
    setPounds(null);
  }

  function remove(id: string) {
    patch((current) => ({
      ...current,
      weights: current.weights.filter((entry) => entry.id !== id),
    }));
  }

  return (
    <div className={`person-${personId} flex min-h-svh flex-col`}>
      <header className="px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Progress tracker</p>
            <h1 className="font-display mt-1 text-[2.65rem] leading-none">Body weight</h1>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sun text-ink shadow-[0_8px_18px_rgba(231,138,52,0.25)]">
            <AppIcon name="scale" className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Log {PEOPLE[personId].name}&apos;s weight and keep an eye on the trend, not a single day.
        </p>
        <div className="mt-4">
          <PersonTabs
            active={personId}
            onChange={(id) => {
              setPersonId(id);
              setPounds(latestWeight(state.weights, id)?.pounds ?? null);
            }}
            live={{}}
          />
        </div>
      </header>
      <main className="flex-1 px-5 pb-8">
        <section className="surface-card lift-card p-4">
          <p className="eyebrow">Latest check-in</p>
          <p className="font-display mt-1 text-5xl leading-none">
            {trend.current ? `${trend.current.pounds}` : "—"}
            <span className="ml-2 text-2xl text-muted">lb</span>
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <TrendStat label="Last log" value={formatDelta(trend.delta)} />
            <TrendStat label="7 days" value={formatDelta(trend.weekDelta)} />
            <TrendStat label="30 days" value={formatDelta(trend.monthDelta)} />
          </div>
          <div className="mt-4">
            <WeightChart entries={chartEntries} />
          </div>
        </section>

        <section className="surface-card mt-5 p-4">
          <div className="flex items-center gap-2">
            <span className="accent-soft accent-text grid h-9 w-9 place-items-center rounded-xl">
              <AppIcon name="plus" className="h-4 w-4" />
            </span>
            <h2 className="font-display text-2xl">Log weight</h2>
          </div>
          <label className="mt-3 block text-xs tracking-[0.14em] text-muted uppercase">
            Date
            <input
              type="text"
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="input-shell mt-1 h-11 w-full px-3"
            />
          </label>
          <div className="mt-2 flex gap-2">
            {[
              { label: "Today", value: todayKey() },
              { label: "7 days ago", value: shiftDayKey(todayKey(), -7) },
              { label: "30 days ago", value: shiftDayKey(todayKey(), -30) },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setDate(chip.value)}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  date === chip.value ? "accent-bg text-paper" : "bg-bg"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          {date && !isDayKey(date) ? (
            <p className="mt-2 text-xs text-[#b24a34]">Use YYYY-MM-DD, like {todayKey()}.</p>
          ) : date && isDayKey(date) ? (
            <p className="mt-2 text-xs text-muted">{formatLongDate(date)}</p>
          ) : null}
          <label className="mt-3 block text-xs tracking-[0.14em] text-muted uppercase">
            Weight
            <div className="mt-1">
              <NumberStepper value={pounds} step={0.2} min={0} suffix="lb" onChange={setPounds} />
            </div>
          </label>
          <button
            type="button"
            onClick={save}
            className="accent-action mt-4 w-full py-3"
          >
            Save weigh-in
          </button>
        </section>

        <section className="mt-6">
          <p className="eyebrow">History</p>
          <h2 className="font-display text-2xl">Check-ins by date</h2>
          {entries.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No weigh-ins yet. Start with today.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {[...entries].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="surface-card flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{formatLongDate(entry.date)}</p>
                    <p className="text-sm text-muted">{entry.pounds} lb</p>
                  </div>
                  <button type="button" className="text-xs text-muted" onClick={() => remove(entry.id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <AppNav />
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

function formatLongDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
