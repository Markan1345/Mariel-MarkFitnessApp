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
  addStepEntry,
  averageDailySteps,
  clearPhoneStepsForDay,
  dailyStepTotal,
  LIVE_STEP_ENTRY_LABEL,
  liveCounterSteps,
  phoneStepsForDay,
  removeStepEntry,
  stepEntriesForDay,
  stepHistory,
  stepHistoryForMonth,
  stepHistoryForWeek,
  stepsThisMonth,
  stepsThisWeek,
  updateStepEntry,
  upsertLabeledStepEntry,
} from "@/lib/steps";
import { formatMonthLabel, formatWeekRange, startOfWeek } from "@/lib/weekdays";
import { todayKey } from "@/lib/weight";
import type { PersonId, StepEntry } from "@/lib/types";

type StepRange = "day" | "week" | "month";

export default function StepsPage() {
  const { state, patch } = useFitnessStore();
  const [personId, setPersonId] = useState<PersonId>("mark");
  const [range, setRange] = useState<StepRange>("day");
  const [newEntrySteps, setNewEntrySteps] = useState<number | null>(null);
  const [newEntryLabel, setNewEntryLabel] = useState("");
  const [date, setDate] = useState(todayKey());
  const todaySteps = dailyStepTotal(state, personId, todayKey());
  const dayEntries = useMemo(
    () => stepEntriesForDay(state.stepLogs ?? [], personId, date),
    [state.stepLogs, personId, date],
  );
  const dayPhoneTotal = useMemo(
    () => phoneStepsForDay(state.stepLogs ?? [], personId, date),
    [state.stepLogs, personId, date],
  );
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

  function addPhoneEntry() {
    if (newEntrySteps === null || Number.isNaN(newEntrySteps) || newEntrySteps < 0 || !isDayKey(date)) {
      return;
    }
    patch((current) => ({
      ...current,
      stepLogs: addStepEntry(current.stepLogs ?? [], {
        personId,
        date,
        steps: Math.round(newEntrySteps),
        label: newEntryLabel.trim() || undefined,
      }),
    }));
    setNewEntrySteps(null);
    setNewEntryLabel("");
  }

  function adjustEntry(entryId: string, steps: number | null) {
    if (steps === null || Number.isNaN(steps) || steps < 0 || !isDayKey(date)) return;
    patch((current) => ({
      ...current,
      stepLogs: updateStepEntry(current.stepLogs ?? [], {
        personId,
        date,
        entryId,
        steps: Math.round(steps),
      }),
    }));
  }

  function deleteEntry(entryId: string) {
    patch((current) => ({
      ...current,
      stepLogs: removeStepEntry(current.stepLogs ?? [], { personId, date, entryId }),
    }));
  }

  function persistLiveCounter(nextSteps: number) {
    patch((current) => ({
      ...current,
      stepLogs: upsertLabeledStepEntry(current.stepLogs ?? [], {
        personId,
        date: todayKey(),
        label: LIVE_STEP_ENTRY_LABEL,
        steps: nextSteps,
      }),
    }));
  }

  function removePhoneLog(day: string) {
    patch((current) => ({
      ...current,
      stepLogs: clearPhoneStepsForDay(current.stepLogs ?? [], personId, day),
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
          {PEOPLE[personId].name}&apos;s day, week, and month. Add multiple phone counts per day — they
          add up. Logged cardio and pickup-game estimates count too.
        </p>
      </header>
      <StickyPersonBar>
        <PersonTabs active={personId} onChange={setPersonId} live={{}} />
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
                liveCounterSteps={liveCounterSteps(state.stepLogs ?? [], personId, todayKey())}
                dayPhoneTotal={todaySteps.phoneSteps}
                onChange={persistLiveCounter}
              />
            </div>

            <section className="surface-card mt-5 p-4">
              <div className="flex items-center gap-2">
                <span className="accent-soft accent-text grid h-9 w-9 place-items-center rounded-xl">
                  <AppIcon name="plus" className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-2xl">Phone step counts</h2>
                  <p className="text-xs text-muted">
                    {dayEntries.length > 0
                      ? `${formatSteps(dayPhoneTotal)} from ${dayEntries.length} ${dayEntries.length === 1 ? "entry" : "entries"} on ${formatLongDate(date)}`
                      : `Add one or more counts for ${formatLongDate(date)}.`}
                  </p>
                </div>
              </div>

              <label className="mt-4 block text-xs tracking-[0.14em] text-muted uppercase">
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
                  { label: "Yesterday", value: shiftDayKey(todayKey(), -1) },
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

              {dayEntries.length > 0 ? (
                <div className="mt-4 grid gap-2">
                  {dayEntries.map((entry) => (
                    <StepEntryRow
                      key={entry.id}
                      entry={entry}
                      onAdjust={(steps) => adjustEntry(entry.id, steps)}
                      onRemove={() => deleteEntry(entry.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  Paste a total from Apple Fitness or Google Fit, or type what you walked.
                </p>
              )}

              <div className="mt-4 rounded-2xl border border-dashed border-line bg-bg/70 p-3">
                <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Add another count</p>
                <label className="mt-2 block text-xs text-muted">
                  Label (optional)
                  <input
                    type="text"
                    placeholder="Morning walk, Apple Fitness…"
                    value={newEntryLabel}
                    onChange={(event) => setNewEntryLabel(event.target.value)}
                    className="input-shell mt-1 h-10 w-full px-3 text-sm"
                  />
                </label>
                <label className="mt-3 block text-xs tracking-[0.14em] text-muted uppercase">
                  Steps
                  <div className="mt-1">
                    <NumberStepper
                      value={newEntrySteps}
                      step={100}
                      min={0}
                      suffix="steps"
                      wide
                      onChange={(value) => setNewEntrySteps(value == null ? null : Math.round(value))}
                    />
                  </div>
                </label>
                <button type="button" onClick={addPhoneEntry} className="accent-action mt-3 w-full py-3">
                  Add step count
                </button>
              </div>
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

function StepEntryRow({
  entry,
  onAdjust,
  onRemove,
}: {
  entry: StepEntry;
  onAdjust: (steps: number | null) => void;
  onRemove: () => void;
}) {
  const label = entry.label?.trim() || "Step count";

  return (
    <div className="rounded-2xl border border-line bg-paper px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold">{label}</p>
          <p className="text-xs text-muted">{formatSteps(entry.steps)}</p>
        </div>
        <button type="button" onClick={onRemove} className="text-xs text-muted">
          Remove
        </button>
      </div>
      <div className="mt-2">
        <NumberStepper
          value={entry.steps}
          step={100}
          min={0}
          suffix="steps"
          wide
          onChange={onAdjust}
        />
      </div>
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
