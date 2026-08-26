"use client";

import { useMemo, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { AppNav } from "@/components/AppNav";
import { ExercisePicker } from "@/components/ExercisePicker";
import { PersonTabs } from "@/components/PersonTabs";
import { StickyPersonBar } from "@/components/StickyPersonBar";
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
  setDayMirror,
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
          exercises: effective?.mirrorFrom
            ? []
            : (effective?.exercises ?? []).map((exercise) => ({ ...exercise })),
          mirrorFrom: effective?.mirrorFrom ?? null,
        }),
    );
    setBuilderOpen(true);
  }

  return (
    <div className={`person-${personId} flex min-h-svh flex-col`}>
      <header className="px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Training plan</p>
            <h1 className="font-display mt-1 text-[2.65rem] leading-none">Build your week</h1>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sun text-ink shadow-[0_8px_18px_rgba(231,138,52,0.25)]">
            <AppIcon name="calendar" className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-muted">
          Set this week, prep the next, and walk into every session ready.
        </p>
      </header>
      <StickyPersonBar>
        <PersonTabs active={personId} onChange={setPersonId} live={{}} />
      </StickyPersonBar>
      <main className="flex-1 px-5 pt-4 pb-8">
        {todaysPlan ? (
          <div className="surface-card lift-card flex items-center justify-between p-4">
            <div>
              <p className="eyebrow">Today for {PEOPLE[personId].name}</p>
              <p className="font-display mt-1 text-2xl">{todaysPlan.title}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-muted">
                <AppIcon name="dumbbell" className="h-3.5 w-3.5" />
                {todaysPlan.exercises.length} moves planned
              </p>
            </div>
            <span className="accent-bg relative z-10 grid h-11 w-11 place-items-center rounded-2xl text-paper">
              <AppIcon name="activity" className="h-5 w-5" />
            </span>
          </div>
        ) : (
          <div className="surface-card flex items-center gap-3 border-dashed p-4 text-sm text-muted">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sun/30 text-gold">
              <AppIcon name="plus" className="h-5 w-5" />
            </span>
            No workout assigned to today yet.
          </div>
        )}

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="eyebrow">Schedule</p>
              <h2 className="font-display text-2xl">Weekly lineup</h2>
            </div>
            <p className="text-xs font-bold text-muted" suppressHydrationWarning>
              {formatWeekRange(selectedWeekStartDate)}
            </p>
          </div>
          <div className="segmented-control grid grid-cols-2 gap-1">
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
                  className={`rounded-[0.85rem] px-3 py-2.5 text-sm font-extrabold ${
                    selected ? "accent-bg text-paper shadow-sm" : "text-muted"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid gap-2">
            {datesInWeek(selectedWeekStartDate).map((date) => {
              const weekday = weekdayFromDate(date);
              const plan = planForWeekday(state.plans, personId, weekday, selectedWeekStart);
              const plannedForWeek = plan?.weekStart === selectedWeekStart;
              const isToday = localDateKey(date) === localDateKey(now);
              const partnerId: PersonId = personId === "mark" ? "mariel" : "mark";
              const partnerPlan = planForWeekday(state.plans, partnerId, weekday, selectedWeekStart);
              const mirroring = Boolean(plan?.mirrorFrom);
              return (
                <div
                  key={localDateKey(date)}
                  className={`surface-card overflow-hidden ${isToday ? "ring-2 ring-energy/50" : ""}`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3.5 py-3 text-left"
                    onClick={() => openDay(date)}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                          plan ? "accent-soft accent-text" : "bg-bg text-muted"
                        }`}
                      >
                        <span className="text-center">
                          <span className="block text-[9px] font-extrabold tracking-wide uppercase">
                            {WEEKDAYS[weekday].short}
                          </span>
                          <span className="block text-base font-extrabold leading-none" suppressHydrationWarning>
                            {date.getDate()}
                          </span>
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-1.5 text-sm font-extrabold">
                          {plan ? plan.title : "Rest or add workout"}
                          {isToday ? (
                            <span className="rounded-full bg-sun/40 px-1.5 py-0.5 text-[9px] font-extrabold text-gold">
                              TODAY
                            </span>
                          ) : null}
                          {mirroring ? (
                            <span className="rounded-full bg-energy/15 px-1.5 py-0.5 text-[9px] font-extrabold text-energy">
                              Mirrors {PEOPLE[plan!.mirrorFrom!].name}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-muted">
                          {plan
                            ? `${plan.exercises.length} moves${
                                mirroring ? "" : plannedForWeek ? " · planned" : " · usual"
                              }`
                            : "Tap to build this day"}
                        </span>
                      </span>
                    </span>
                    <span className="relative z-10 grid h-8 w-8 place-items-center rounded-xl bg-bg text-muted">
                      <AppIcon name={plan ? "chevron-right" : "plus"} className="h-4 w-4" />
                    </span>
                  </button>
                  {personId === "mariel" && partnerPlan && !mirroring ? (
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-1.5 border-t border-line/70 bg-bg/50 px-3 py-2 text-xs font-extrabold text-energy"
                      onClick={() =>
                        patch((current) => ({
                          ...current,
                          plans: setDayMirror(current.plans, {
                            personId: "mariel",
                            weekday,
                            weekStart: selectedWeekStart,
                            mirrorFrom: "mark",
                            alsoUsual: weekView === "this",
                          }),
                        }))
                      }
                    >
                      <AppIcon name="spark" className="h-3.5 w-3.5" />
                      Mirror Mark · {partnerPlan.title}
                    </button>
                  ) : null}
                  {personId === "mariel" && mirroring ? (
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-1.5 border-t border-line/70 bg-bg/50 px-3 py-2 text-xs font-extrabold text-muted"
                      onClick={() =>
                        patch((current) => ({
                          ...current,
                          plans: setDayMirror(current.plans, {
                            personId: "mariel",
                            weekday,
                            weekStart: plan?.weekStart ?? selectedWeekStart,
                            mirrorFrom: null,
                          }),
                        }))
                      }
                    >
                      Stop mirroring Mark
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {weekView === "next" ? (
            <button
              type="button"
              className="surface-card mt-3 flex w-full items-center justify-center gap-2 py-3 text-sm font-extrabold"
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
              <AppIcon name="spark" className="h-4 w-4 text-energy" />
              Fill open days from this week
            </button>
          ) : null}
        </section>

        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed border-energy/40 bg-energy/5 py-4 font-extrabold text-energy"
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
          <AppIcon name="plus" className="h-5 w-5" />
          New usual workout
        </button>

        {personPlans.filter((plan) => plan.weekday === null).length > 0 ? (
          <section className="mt-6">
            <p className="eyebrow">Saved</p>
            <h2 className="font-display text-2xl">Saved customs</h2>
            <div className="mt-3 grid gap-2">
              {personPlans
                .filter((plan) => plan.weekday === null)
                .map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    className="surface-card px-4 py-3 text-left"
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
          <p className="eyebrow">Programs</p>
          <h2 className="font-display text-2xl">Import a training split</h2>
          <p className="mt-1 text-sm text-muted">
            Drop a program onto {PEOPLE[personId].name}&apos;s usual week. Customize next week without changing this one.
          </p>
          <div className="mt-3 grid gap-2">
            {WORKOUT_PROGRAMS.map((program) => (
              <button
                key={program.id}
                type="button"
                onClick={() => importForPerson(program.id)}
                className="surface-card lift-card p-4 text-left"
              >
                <span className="font-extrabold">{program.title}</span>
                <span className="mt-1 block text-sm text-muted">{program.blurb}</span>
                <span className="mt-2 inline-flex rounded-full bg-sun/30 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-gold uppercase">
                  {program.days.length} days
                </span>
              </button>
            ))}
          </div>
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed border-energy/40 bg-energy/5 px-4 py-4 text-center text-sm font-extrabold text-energy">
            <AppIcon name="plus" className="h-4 w-4" />
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
          partnerPlan={
            editing.weekday !== null
              ? planForWeekday(
                  state.plans,
                  editing.personId === "mark" ? "mariel" : "mark",
                  editing.weekday,
                  editing.weekStart,
                )
              : undefined
          }
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
  partnerPlan,
  onClose,
  onSave,
  onDelete,
}: {
  plan: CustomPlan;
  alsoUsual: boolean;
  weekLabel: string | null;
  partnerPlan?: CustomPlan;
  onClose: () => void;
  onSave: (plan: CustomPlan, alsoUsual: boolean) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState(plan);
  const [useEveryWeek, setUseEveryWeek] = useState(alsoUsual);
  const [pickerOpen, setPickerOpen] = useState(false);
  const weekdayOptions = useMemo(() => [{ id: -1, label: "No specific day" }, ...WEEKDAYS], []);
  const canMirrorMark =
    draft.personId === "mariel" &&
    draft.weekday !== null &&
    Boolean(partnerPlan) &&
    partnerPlan?.personId === "mark";
  const mirroring = draft.mirrorFrom === "mark";
  const displayExercises = mirroring && partnerPlan ? partnerPlan.exercises : draft.exercises;

  function addMove(name: string, kind: ExerciseKind) {
    const next: PlannedExercise = { name, kind };
    setDraft((current) => ({
      ...current,
      mirrorFrom: null,
      exercises: [...current.exercises, next],
    }));
  }

  function enableMirror() {
    if (!partnerPlan || draft.weekday === null) return;
    setDraft({
      ...draft,
      title: partnerPlan.title,
      mirrorFrom: "mark",
      exercises: [],
    });
  }

  function stopMirror({ keepExercises }: { keepExercises: boolean }) {
    setDraft({
      ...draft,
      mirrorFrom: null,
      exercises: keepExercises && partnerPlan
        ? partnerPlan.exercises.map((exercise) => ({ ...exercise }))
        : draft.exercises,
      title: keepExercises && partnerPlan ? partnerPlan.title : draft.title,
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/55 p-3 backdrop-blur-sm sm:items-center">
      <div className="surface-card flex max-h-[92svh] w-full max-w-[430px] flex-col p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Build session</p>
            <h2 className="font-display text-3xl">Custom workout</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted">
            Close
          </button>
        </div>
        {weekLabel ? (
          <p className="mt-1 text-sm text-muted" suppressHydrationWarning>
            Planning {weekLabel}
          </p>
        ) : null}
        {canMirrorMark ? (
          <div className="mt-3 rounded-2xl border border-line bg-bg/70 px-3 py-3">
            <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Mirror Mark</p>
            <p className="mt-1 text-sm text-muted">
              {mirroring
                ? "This day follows Mark’s plan and updates when he changes it."
                : `Use Mark’s ${partnerPlan?.title ?? "workout"} for this day.`}
            </p>
            {mirroring ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="rounded-2xl border border-line bg-paper py-2 text-xs font-extrabold"
                  onClick={() => stopMirror({ keepExercises: true })}
                >
                  Copy &amp; edit
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-line bg-paper py-2 text-xs font-extrabold text-muted"
                  onClick={() => stopMirror({ keepExercises: false })}
                >
                  Stop mirroring
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="accent-action mt-2 w-full py-2.5 text-sm"
                onClick={enableMirror}
              >
                Mirror Mark · {partnerPlan?.title}
              </button>
            )}
          </div>
        ) : null}
        <input
          value={mirroring && partnerPlan ? partnerPlan.title : draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value, mirrorFrom: null })}
          className="input-shell mt-4 h-11 px-4"
          placeholder="Workout name"
          disabled={mirroring}
        />
        <label className="mt-3 text-xs tracking-[0.14em] text-muted uppercase">
          Day
          <select
            className="input-shell mt-1 h-11 w-full px-3"
            value={draft.weekday ?? -1}
            onChange={(event) => {
              const value = Number(event.target.value);
              const weekday = value === -1 ? null : (value as Weekday);
              setDraft({
                ...draft,
                weekday,
                weekStart: weekday === null ? null : draft.weekStart,
                mirrorFrom: weekday === null ? null : draft.mirrorFrom,
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
          {displayExercises.length === 0 ? (
            <p className="text-sm text-muted">
              {mirroring ? "Mark has no moves on this day yet." : "Add lifts and cardio for this day."}
            </p>
          ) : (
            <ul className="grid gap-2">
              {displayExercises.map((exercise, index) => (
                <li key={`${exercise.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-bg px-3 py-2.5">
                  <span className="font-bold">
                    {exercise.name}
                    <span className="ml-2 text-xs uppercase text-muted">{exercise.kind}</span>
                  </span>
                  {!mirroring ? (
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
                  ) : (
                    <span className="text-[10px] font-bold tracking-wide text-muted uppercase">From Mark</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!mirroring ? (
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-energy/40 bg-energy/5 py-3 text-sm font-extrabold text-energy"
              onClick={() => setPickerOpen(true)}
            >
              <AppIcon name="plus" className="h-4 w-4" />
              Add lift or cardio
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="accent-action mt-4 w-full py-3"
          onClick={() =>
            onSave(
              mirroring
                ? {
                    ...draft,
                    title: partnerPlan?.title ?? draft.title,
                    exercises: [],
                    mirrorFrom: "mark",
                  }
                : { ...draft, mirrorFrom: null },
              useEveryWeek,
            )
          }
        >
          {mirroring ? "Save mirror day" : "Save custom workout"}
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
