"use client";

import { useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { ExercisePicker } from "@/components/ExercisePicker";
import { PersonTabs } from "@/components/PersonTabs";
import { PEOPLE } from "@/lib/people";
import {
  WORKOUT_PROGRAMS,
  copyWeekPlans,
  createPlan,
  deletePlan,
  importProgram,
  parseImportedProgram,
  planForDate,
  planForWeekday,
  plansForPerson,
  savePlanForWeek,
} from "@/lib/programs";
import { useFitnessStore } from "@/lib/use-fitness-store";
import {
  WEEKDAYS,
  addDays,
  datesInWeek,
  formatWeekRange,
  localDateKey,
  startOfWeek,
  weekStartKey,
  weekdayFromDate,
} from "@/lib/weekdays";
import type { CustomPlan, ExerciseKind, PersonId, PlannedExercise, Weekday } from "@/lib/types";

type WeekView = "this" | "next";

export default function PlansPage() {
  const { state, patch } = useFitnessStore();
  const [personId, setPersonId] = useState<PersonId>("mark");
  const [weekView, setWeekView] = useState<WeekView>("this");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<CustomPlan | null>(null);
  const [alsoUsual, setAlsoUsual] = useState(false);
  const [importError, setImportError] = useState("");
  const personPlans = plansForPerson(state.plans, personId);
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const nextWeekStartDate = addDays(thisWeekStart, 7);
  const selectedWeekStartDate = weekView === "this" ? thisWeekStart : nextWeekStartDate;
  const selectedWeekStart = weekStartKey(selectedWeekStartDate);
  const todaysPlan = planForDate(state.plans, personId, now);

  function savePlan(plan: CustomPlan, useEveryWeek: boolean) {
    patch((current) => ({ ...current, plans: savePlanForWeek(current.plans, plan, useEveryWeek) }));
    setBuilderOpen(false);
    setEditing(null);
  }

  function removePlan(id: string) {
    patch((current) => ({ ...current, plans: deletePlan(current.plans, id) }));
  }

  function importForPerson(programId: string) {
    const program = WORKOUT_PROGRAMS.find((item) => item.id === programId);
    if (!program) return;
    patch((current) => ({
      ...current,
      plans: importProgram(current.plans, program, [personId]),
    }));
  }

  async function importFile(file: File) {
    setImportError("");
    try {
      const parsed = parseImportedProgram(JSON.parse(await file.text()));
      if (!parsed) {
        setImportError("That file is not a valid workout program.");
        return;
      }
      patch((current) => ({
        ...current,
        plans: importProgram(current.plans, parsed, [personId]),
      }));
    } catch {
      setImportError("Could not read that JSON file.");
    }
  }

  function openDay(date: Date) {
    const weekday = weekdayFromDate(date);
    const weekStart = weekStartKey(date);
    const override = personPlans.find(
      (plan) => plan.weekday === weekday && plan.weekStart === weekStart,
    );
    const effective = planForWeekday(state.plans, personId, weekday, weekStart);
    setAlsoUsual(!override && weekView === "this");
    setEditing(
      override ??
        createPlan({
          personId,
          title: effective?.title ?? `${WEEKDAYS[weekday].label} workout`,
          weekday,
          weekStart,
          exercises: (effective?.exercises ?? []).map((exercise) => ({ ...exercise })),
        }),
    );
    setBuilderOpen(true);
  }

  return (
    <div className={`person-${personId} flex min-h-svh flex-col`}>
      <header className="px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-3">
        <p className="text-sm tracking-[0.22em] text-muted uppercase">Library</p>
        <h1 className="font-display mt-2 text-4xl leading-none">Custom days</h1>
        <p className="mt-3 text-sm text-muted">
          Plan this week or next. Next week&apos;s workouts show in this plan, then become this week when the dates arrive.
        </p>
        <div className="mt-4">
          <PersonTabs active={personId} onChange={setPersonId} live={{}} />
        </div>
      </header>
      <main className="flex-1 px-5 pb-8">
        {todaysPlan ? (
          <div className="rounded-3xl border border-line bg-paper p-4">
            <p className="text-xs tracking-[0.16em] text-muted uppercase">Today for {PEOPLE[personId].name}</p>
            <p className="font-display mt-1 text-2xl">{todaysPlan.title}</p>
            <p className="mt-1 text-sm text-muted">{todaysPlan.exercises.length} moves planned</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-line px-4 py-5 text-sm text-muted">
            No custom workout assigned to today yet.
          </div>
        )}

        <section className="mt-6">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-line/70 p-1">
            {(
              [
                ["this", "This week"],
                ["next", "Next week"],
              ] as const
            ).map(([id, label]) => {
              const selected = weekView === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setWeekView(id)}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${
                    selected ? "accent-bg text-paper" : "text-ink"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-muted" suppressHydrationWarning>
            {formatWeekRange(selectedWeekStartDate)}
          </p>
          <div className="mt-3 grid gap-2">
            {datesInWeek(selectedWeekStartDate).map((date) => {
              const weekday = weekdayFromDate(date);
              const plan = planForWeekday(state.plans, personId, weekday, selectedWeekStart);
              const plannedForWeek = plan?.weekStart === selectedWeekStart;
              const isToday = localDateKey(date) === localDateKey(now);
              return (
                <button
                  key={localDateKey(date)}
                  type="button"
                  className="flex items-center justify-between rounded-2xl border border-line bg-paper px-4 py-3 text-left"
                  onClick={() => openDay(date)}
                >
                  <span>
                    <span className="block text-sm font-medium">
                      {WEEKDAYS[weekday].label}
                      {isToday ? " · today" : ""}
                    </span>
                    <span className="text-xs text-muted" suppressHydrationWarning>
                      {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {plan
                        ? ` · ${plan.title}${plannedForWeek ? "" : " · usual"}`
                        : " · Tap to add"}
                    </span>
                  </span>
                  <span className="text-xs text-muted">{plan ? `${plan.exercises.length} moves` : "+"}</span>
                </button>
              );
            })}
          </div>
          {weekView === "next" ? (
            <button
              type="button"
              className="mt-3 w-full rounded-2xl border border-line bg-paper py-3 text-sm font-medium"
              onClick={() =>
                patch((current) => ({
                  ...current,
                  plans: copyWeekPlans(
                    current.plans,
                    personId,
                    weekStartKey(thisWeekStart),
                    selectedWeekStart,
                  ),
                }))
              }
            >
              Copy this week to next week
            </button>
          ) : null}
        </section>

        <button
          type="button"
          className="mt-4 w-full rounded-3xl border border-dashed border-line py-4 font-medium"
          onClick={() => {
            const today = weekdayFromDate(now);
            setAlsoUsual(true);
            setEditing(
              createPlan({
                personId,
                title: "Custom workout",
                weekday: today,
                weekStart: null,
                exercises: [],
              }),
            );
            setBuilderOpen(true);
          }}
        >
          New usual workout
        </button>

        {personPlans.filter((plan) => plan.weekday === null).length > 0 ? (
          <section className="mt-6">
            <h2 className="font-display text-2xl">Saved customs</h2>
            <div className="mt-3 grid gap-2">
              {personPlans
                .filter((plan) => plan.weekday === null)
                .map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    className="rounded-2xl border border-line bg-paper px-4 py-3 text-left"
                    onClick={() => {
                      setAlsoUsual(false);
                      setEditing(plan);
                      setBuilderOpen(true);
                    }}
                  >
                    <span className="font-medium">{plan.title}</span>
                    <span className="mt-1 block text-xs text-muted">{plan.exercises.length} moves</span>
                  </button>
                ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="font-display text-2xl">Import weights</h2>
          <p className="mt-1 text-sm text-muted">
            Drop a program onto {PEOPLE[personId].name}&apos;s usual week. Customize next week without changing this one.
          </p>
          <div className="mt-3 grid gap-2">
            {WORKOUT_PROGRAMS.map((program) => (
              <button
                key={program.id}
                type="button"
                onClick={() => importForPerson(program.id)}
                className="rounded-3xl border border-line bg-paper p-4 text-left"
              >
                <span className="font-medium">{program.title}</span>
                <span className="mt-1 block text-sm text-muted">{program.blurb}</span>
                <span className="mt-2 block text-xs tracking-wide text-muted uppercase">
                  {program.days.length} days
                </span>
              </button>
            ))}
          </div>
          <label className="mt-3 block rounded-3xl border border-dashed border-line px-4 py-4 text-center text-sm">
            Import JSON program
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importFile(file);
                event.target.value = "";
              }}
            />
          </label>
          {importError ? <p className="mt-2 text-sm text-[#b24a34]">{importError}</p> : null}
        </section>
      </main>
      <AppNav />
      {builderOpen && editing ? (
        <PlanBuilder
          plan={editing}
          alsoUsual={alsoUsual}
          weekLabel={editing.weekStart ? formatWeekRange(selectedWeekStartDate) : null}
          onClose={() => {
            setBuilderOpen(false);
            setEditing(null);
          }}
          onSave={savePlan}
          onDelete={editing.id && personPlans.some((plan) => plan.id === editing.id) ? removePlan : undefined}
        />
      ) : null}
    </div>
  );
}

function PlanBuilder({
  plan,
  alsoUsual,
  weekLabel,
  onClose,
  onSave,
  onDelete,
}: {
  plan: CustomPlan;
  alsoUsual: boolean;
  weekLabel: string | null;
  onClose: () => void;
  onSave: (plan: CustomPlan, alsoUsual: boolean) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState(plan);
  const [useEveryWeek, setUseEveryWeek] = useState(alsoUsual);
  const [pickerOpen, setPickerOpen] = useState(false);
  const weekdayOptions = useMemo(() => [{ id: -1, label: "No specific day" }, ...WEEKDAYS], []);

  function addMove(name: string, kind: ExerciseKind) {
    const next: PlannedExercise = { name, kind };
    setDraft((current) => ({ ...current, exercises: [...current.exercises, next] }));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-3 sm:items-center">
      <div className="flex max-h-[92svh] w-full max-w-[430px] flex-col rounded-3xl bg-paper p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl">Custom workout</h2>
          <button type="button" onClick={onClose} className="text-sm text-muted">
            Close
          </button>
        </div>
        {weekLabel ? (
          <p className="mt-1 text-sm text-muted" suppressHydrationWarning>
            Planning {weekLabel}
          </p>
        ) : null}
        <input
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          className="mt-4 h-11 rounded-2xl border border-line bg-bg px-4"
          placeholder="Workout name"
        />
        <label className="mt-3 text-xs tracking-[0.14em] text-muted uppercase">
          Day
          <select
            className="mt-1 h-11 w-full rounded-2xl border border-line bg-bg px-3"
            value={draft.weekday ?? -1}
            onChange={(event) => {
              const value = Number(event.target.value);
              const weekday = value === -1 ? null : (value as Weekday);
              setDraft({
                ...draft,
                weekday,
                weekStart: weekday === null ? null : draft.weekStart,
              });
            }}
          >
            {weekdayOptions.map((day) => (
              <option key={day.id} value={day.id}>
                {day.label}
              </option>
            ))}
          </select>
        </label>
        {draft.weekday !== null ? (
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useEveryWeek}
              onChange={(event) => setUseEveryWeek(event.target.checked)}
            />
            Also use every {WEEKDAYS[draft.weekday].label}
          </label>
        ) : null}
        <div className="mt-4 overflow-y-auto">
          {draft.exercises.length === 0 ? (
            <p className="text-sm text-muted">Add lifts and cardio for this day.</p>
          ) : (
            <ul className="grid gap-2">
              {draft.exercises.map((exercise, index) => (
                <li key={`${exercise.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-bg px-3 py-2">
                  <span>
                    {exercise.name}
                    <span className="ml-2 text-xs uppercase text-muted">{exercise.kind}</span>
                  </span>
                  <button
                    type="button"
                    className="text-xs text-muted"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        exercises: draft.exercises.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="mt-3 w-full rounded-2xl border border-dashed border-line py-3 text-sm font-medium"
            onClick={() => setPickerOpen(true)}
          >
            Add lift or cardio
          </button>
        </div>
        <button
          type="button"
          className="accent-bg mt-4 w-full rounded-2xl py-3 font-semibold text-paper"
          onClick={() => onSave(draft, useEveryWeek)}
        >
          Save custom workout
        </button>
        {onDelete ? (
          <button
            type="button"
            className="mt-2 w-full py-2 text-sm text-muted"
            onClick={() => {
              onDelete(draft.id);
              onClose();
            }}
          >
            Delete
          </button>
        ) : null}
        <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={(name, kind) => {
          addMove(name, kind);
          setPickerOpen(false);
        }} />
      </div>
    </div>
  );
}
