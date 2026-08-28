"use client";

import { useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { AppIcon } from "@/components/AppIcon";
import { NumberStepper } from "@/components/NumberStepper";
import { PersonTabs } from "@/components/PersonTabs";
import { PhoneStepTracker } from "@/components/PhoneStepTracker";
import { StepBars } from "@/components/StepBars";
import { StickyPersonBar } from "@/components/StickyPersonBar";
import { PEOPLE } from "@/lib/people";
import { useFitnessStore } from "@/lib/use-fitness-store";
import { formatSteps } from "@/lib/store";
import { isDayKey, shiftDayKey } from "@/lib/numbers";
import {
  averageDailySteps,
  createStepLog,
  dailyStepTotal,
  stepHistory,
  stepHistoryForMonth,
  stepHistoryForWeek,
  stepsThisMonth,
  stepsThisWeek,
  upsertStepLog,
} from "@/lib/steps";
import { formatMonthLabel, formatWeekRange, startOfWeek } from "@/lib/weekdays";
import { todayKey } from "@/lib/weight";
import type { PersonId } from "@/lib/types";

type StepRange = "day" | "week" | "month";

export default function StepsPage() {
  const { state, patch } = useFitnessStore();
  const [personId, setPersonId] = useState<PersonId>("mark");
  const [range, setRange] = useState<StepRange>("day");
  const [phoneSteps, setPhoneSteps] = useState<number | null>(null);
  const [date, setDate] = useState(todayKey());
  const todaySteps = dailyStepTotal(state, personId, todayKey());
  const recentDays = useMemo(() => stepHistory(state, personId, 7), [state, personId]);
  const weekDays = useMemo(() => stepHistoryForWeek(state, personId), [state, personId]);
  const monthDays = useMemo(() => stepHistoryForMonth(state, personId), [state, personId]);
  const weekSteps = stepsThisWeek(state, personId);
  const monthSteps = stepsThisMonth(state, personId);
  const weekAvg = averageDailySteps(weekDays);
  const monthAvg = averageDailySteps(monthDays);
  const listDays = (range === "month" ? monthDays : weekDays)
    .filter((day) => (range === "day" ? day.date === todayKey() : day.total > 0))
    .slice()
    .reverse();

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

  const hero =
    range === "day"
      ? { value: todaySteps.total, label: "Today", unit: "steps" }
      : range === "week"
        ? { value: weekSteps, label: formatWeekRange(startOfWeek(new Date())), unit: "steps this week" }
        : { value: monthSteps, label: formatMonthLabel(new Date()), unit: "steps this month" };

  return (
    <div className={`person-${personId} flex min-h-svh flex-col`}>
      <header className="px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Step tracker</p>
            <h1 className="font-display mt-1 text-[2.65rem] leading-none">Steps</h1>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sun text-ink shadow-[0_8px_18px_rgba(231,138,52,0.25)]">
            <AppIcon name="steps" className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {PEOPLE[personId].name}&apos;s day, week, and month. Phone counting, logged cardio, and
          pickup-game estimates all add in.
        </p>
      </header>
      <StickyPersonBar>
        <PersonTabs
          active={personId}
          onChange={(id) => {
            setPersonId(id);
            setPhoneSteps(dailyStepTotal(state, id, todayKey()).phoneSteps || null);
          }}
          live={{}}
        />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              { id: "day", label: "Day" },
              { id: "week", label: "Week" },
              { id: "month", label: "Month" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={`rounded-2xl px-3 py-2.5 text-sm font-extrabold ${
                range === item.id ? "accent-bg text-paper" : "border border-line bg-paper text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </StickyPersonBar>
      <main className="flex-1 px-5 pt-4 pb-8">
        <section className="surface-card lift-card p-4">
          <p className="eyebrow">{hero.label}</p>
          <p className="font-display mt-1 text-5xl leading-none">
            {hero.value.toLocaleString()}
            <span className="ml-2 text-2xl text-muted">steps</span>
          </p>
          <p className="mt-1 text-xs font-medium text-muted">{hero.unit}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            {range === "day" ? (
              <>
                <TrendStat label="Phone" value={todaySteps.phoneSteps.toLocaleString()} />
                <TrendStat label="Workouts" value={todaySteps.workoutSteps.toLocaleString()} />
                <TrendStat label="This week" value={weekSteps.toLocaleString()} />
              </>
            ) : range === "week" ? (
              <>
                <TrendStat label="Today" value={todaySteps.total.toLocaleString()} />
                <TrendStat label="Avg / day" value={weekAvg.toLocaleString()} />
                <TrendStat label="This month" value={monthSteps.toLocaleString()} />
              </>
            ) : (
              <>
                <TrendStat label="Today" value={todaySteps.total.toLocaleString()} />
                <TrendStat label="This week" value={weekSteps.toLocaleString()} />
                <TrendStat label="Avg / day" value={monthAvg.toLocaleString()} />
              </>
            )}
          </div>
          <div className="mt-4">
            {range === "month" ? (
              <StepBars days={monthDays} label="day" barMax={44} />
            ) : range === "week" ? (
              <StepBars days={weekDays} barMax={48} />
            ) : (
              <StepBars days={recentDays} barMax={40} />
            )}
          </div>
        </section>

        {range === "day" ? (
          <>
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
          </>
        ) : null}

        <section className="mt-6">
          <p className="eyebrow">Progression</p>
          <h2 className="font-display text-2xl">
            {range === "day" ? "Today" : range === "week" ? "This week" : "This month"}
          </h2>
          {listDays.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No steps yet. Count on your phone or log a pickup game, walk, or other cardio.
            </p>
          ) : (
            <div className="mt-3 grid gap-2">
              {listDays.map((day) => (
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

function formatLongDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
