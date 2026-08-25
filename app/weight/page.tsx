"use client";

import { useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
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
      <header className="px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-3">
        <p className="text-sm tracking-[0.22em] text-muted uppercase">US / lb</p>
        <h1 className="font-display mt-2 text-4xl leading-none">Body weight</h1>
        <p className="mt-3 text-sm text-muted">
          Log {PEOPLE[personId].name}&apos;s weight in pounds. The chart follows the trend by date.
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
        <section className="rounded-3xl border border-line bg-paper p-4">
          <p className="text-sm text-muted">Latest</p>
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

        <section className="mt-5 rounded-3xl border border-line bg-paper p-4">
          <h2 className="font-display text-2xl">Log weight</h2>
          <label className="mt-3 block text-xs tracking-[0.14em] text-muted uppercase">
            Date
            <input
              type="text"
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-line bg-bg px-3"
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
            className="accent-bg mt-4 w-full rounded-2xl py-3 font-semibold text-paper"
          >
            Save weigh-in
          </button>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-2xl">By date</h2>
          {entries.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No weigh-ins yet. Start with today.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {[...entries].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-2xl border border-line bg-paper px-4 py-3"
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
      <p className="text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
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
