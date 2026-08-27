"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { AppIcon } from "@/components/AppIcon";
import { LiftProgressPanel } from "@/components/LiftProgressPanel";
import { NumberStepper } from "@/components/NumberStepper";
import { PersonTabs } from "@/components/PersonTabs";
import { PhoneStepTracker } from "@/components/PhoneStepTracker";
import { StickyPersonBar } from "@/components/StickyPersonBar";
import { StepsChart } from "@/components/StepsChart";
import { WeightChart } from "@/components/WeightChart";
import { PEOPLE } from "@/lib/people";
import { useFitnessStore } from "@/lib/use-fitness-store";
import { formatSteps } from "@/lib/store";
import { isDayKey, shiftDayKey } from "@/lib/numbers";
import { createStepLog, dailyStepTotal, stepHistory, stepsThisWeek, upsertStepLog } from "@/lib/steps";
import { createWeightEntry, latestWeight, todayKey, upsertWeight, weightTrend, weightsForPerson } from "@/lib/weight";
import type { PersonId } from "@/lib/types";

type WeightMode = "body" | "lifts" | "steps";

export default function WeightPage() {
  const { state, patch } = useFitnessStore();
  const [personId, setPersonId] = useState<PersonId>("mark");
  const [mode, setMode] = useState<WeightMode>("body");
  const [pounds, setPounds] = useState<number | null>(null);
  const [phoneSteps, setPhoneSteps] = useState<number | null>(null);
  const [date, setDate] = useState(todayKey());
  const entries = weightsForPerson(state.weights, personId);
  const trend = weightTrend(state.weights, personId);
  const chartEntries = useMemo(() => entries.slice(-30), [entries]);
  const todaySteps = dailyStepTotal(state, personId, todayKey());
  const weekSteps = stepsThisWeek(state, personId);
  const stepDays = useMemo(() => stepHistory(state, personId, 30), [state, personId]);
  const stepList = [...stepDays].reverse().filter((day) => day.total > 0);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "steps" || tab === "lifts" || tab === "body") setMode(tab);
  }, []);

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

  function savePhoneLog() {
    if (phoneSteps === null || Number.isNaN(phoneSteps) || phoneSteps < 0 || !isDayKey(date)) return;
    patch((current) => ({
      ...current,
      stepLogs: upsertStepLog(
        current.stepLogs ?? [],
        createStepLog({ personId, date, phoneSteps: Math.round(phoneSteps) }),
      ),
    }));
    setPhoneSteps(null);
  }

  function persistPhoneToday(nextPhoneSteps: number) {
    patch((current) => ({
      ...current,
      stepLogs: upsertStepLog(
        current.stepLogs ?? [],
        createStepLog({ personId, date: todayKey(), phoneSteps: nextPhoneSteps }),
      ),
    }));
  }

  function removePhoneLog(day: string) {
    patch((current) => ({
      ...current,
      stepLogs: (current.stepLogs ?? []).filter(
        (entry) => !(entry.personId === personId && entry.date === day),
      ),
    }));
  }

  return (
    <div className={`person-${personId} flex min-h-svh flex-col`}>
      <header className="px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Progress tracker</p>
            <h1 className="font-display mt-1 text-[2.65rem] leading-none">
              {mode === "body" ? "Body weight" : mode === "lifts" ? "Lift weight" : "Steps"}
            </h1>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sun text-ink shadow-[0_8px_18px_rgba(231,138,52,0.25)]">
            <AppIcon name={mode === "body" ? "scale" : mode === "lifts" ? "dumbbell" : "steps"} className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {mode === "body"
            ? `Log ${PEOPLE[personId].name}'s weight and keep an eye on the trend, not a single day.`
            : mode === "lifts"
              ? `See how ${PEOPLE[personId].name}'s top set on each lift moves over time.`
              : `Today’s steps, the week total, and a per-day trend. Phone counting and workout cardio both add in.`}
        </p>
      </header>
      <StickyPersonBar>
        <PersonTabs
          active={personId}
          onChange={(id) => {
            setPersonId(id);
            setPounds(latestWeight(state.weights, id)?.pounds ?? null);
            setPhoneSteps(dailyStepTotal(state, id, todayKey()).phoneSteps || null);
          }}
          live={{}}
        />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              { id: "body", label: "Body" },
              { id: "lifts", label: "Lifts" },
              { id: "steps", label: "Steps" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`rounded-2xl px-3 py-2.5 text-sm font-extrabold ${
                mode === item.id ? "accent-bg text-paper" : "border border-line bg-paper text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </StickyPersonBar>
      <main className="flex-1 px-5 pt-4 pb-8">
        {mode === "lifts" ? (
          <LiftProgressPanel workouts={state.workouts} personId={personId} />
        ) : mode === "steps" ? (
          <>
            <section className="surface-card lift-card p-4">
              <p className="eyebrow">Today</p>
              <p className="font-display mt-1 text-5xl leading-none">
                {todaySteps.total.toLocaleString()}
                <span className="ml-2 text-2xl text-muted">steps</span>
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <TrendStat label="Phone" value={todaySteps.phoneSteps.toLocaleString()} />
                <TrendStat label="Workouts" value={todaySteps.workoutSteps.toLocaleString()} />
                <TrendStat label="This week" value={weekSteps.toLocaleString()} />
              </div>
              <div className="mt-4">
                <StepsChart days={stepDays} />
              </div>
            </section>

            <div className="mt-5">
              <PhoneStepTracker
                key={personId}
                personId={personId}
                phoneSteps={todaySteps.phoneSteps}
                onChange={persistPhoneToday}
              />
            </div>

            <section className="surface-card mt-5 p-4">
              <div className="flex items-center gap-2">
                <span className="accent-soft accent-text grid h-9 w-9 place-items-center rounded-xl">
                  <AppIcon name="plus" className="h-4 w-4" />
                </span>
                <h2 className="font-display text-2xl">Log phone steps</h2>
              </div>
              <p className="mt-2 text-xs text-muted">
                Paste a total from Apple Fitness or Google Fit, or type what you walked today.
              </p>
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
              <label className="mt-3 block text-xs tracking-[0.14em] text-muted uppercase">
                Phone steps
                <div className="mt-1">
                  <NumberStepper
                    value={phoneSteps}
                    step={100}
                    min={0}
                    suffix="steps"
                    wide
                    onChange={(value) => setPhoneSteps(value == null ? null : Math.round(value))}
                  />
                </div>
              </label>
              <button type="button" onClick={savePhoneLog} className="accent-action mt-4 w-full py-3">
                Save phone steps
              </button>
            </section>

            <section className="mt-6">
              <p className="eyebrow">Progression</p>
              <h2 className="font-display text-2xl">Steps by day</h2>
              {stepList.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No steps yet. Start counting or log a cardio session.</p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {stepList.map((day) => (
                    <div key={day.date} className="surface-card flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="font-medium">{formatLongDate(day.date)}</p>
                        <p className="text-sm text-muted">
                          {formatSteps(day.total)}
                          {day.phoneSteps > 0 || day.workoutSteps > 0
                            ? ` · ${day.phoneSteps.toLocaleString()} phone · ${day.workoutSteps.toLocaleString()} workouts`
                            : ""}
                        </p>
                      </div>
                      {day.phoneSteps > 0 ? (
                        <button
                          type="button"
                          className="text-xs text-muted"
                          onClick={() => removePhoneLog(day.date)}
                        >
                          Clear phone
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
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
          </>
        )}
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
