"use client";

import { useState } from "react";
import { WORKOUT_TEMPLATES } from "@/lib/exercises";
import { PEOPLE, PERSON_IDS } from "@/lib/people";
import { planForDate, plansForPerson } from "@/lib/programs";
import { defaultStartChoices, type StartChoice } from "@/lib/start";
import type { CustomPlan, PersonId, Workout } from "@/lib/types";
import { WEEKDAYS } from "@/lib/weekdays";
import { WorkoutProgression } from "./WorkoutProgression";

export type { StartChoice };

export function TogetherStartSheet({
  open,
  onClose,
  lastWorkouts,
  plans,
  workouts,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  lastWorkouts: Partial<Record<PersonId, Workout>>;
  plans: CustomPlan[];
  workouts: Workout[];
  onStart: (choices: Record<PersonId, StartChoice>) => void;
}) {
  if (!open) return null;
  return (
    <TogetherStartSheetInner
      lastWorkouts={lastWorkouts}
      plans={plans}
      workouts={workouts}
      onClose={onClose}
      onStart={onStart}
    />
  );
}

function TogetherStartSheetInner({
  lastWorkouts,
  plans,
  workouts,
  onClose,
  onStart,
}: {
  lastWorkouts: Partial<Record<PersonId, Workout>>;
  plans: CustomPlan[];
  workouts: Workout[];
  onClose: () => void;
  onStart: (choices: Record<PersonId, StartChoice>) => void;
}) {
  const [choices, setChoices] = useState<Record<PersonId, StartChoice>>(() =>
    defaultStartChoices(plans),
  );
  const now = new Date();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/55 p-3 backdrop-blur-sm sm:items-center">
      <div className="surface-card flex max-h-[90svh] w-full max-w-[430px] flex-col p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Team session</p>
            <h2 className="font-display text-3xl">Start both</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted">
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          . Use today&apos;s custom plan, a saved day, or a template.
        </p>
        <div className="mt-4 overflow-y-auto pr-1">
          {PERSON_IDS.map((id) => (
            <PersonChoices
              key={id}
              personId={id}
              last={lastWorkouts[id]}
              plans={plansForPerson(plans, id)}
              todayPlan={planForDate(plans, id, now)}
              workouts={workouts}
              value={choices[id]}
              onChange={(choice) => setChoices((current) => ({ ...current, [id]: choice }))}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => onStart(choices)}
          className="primary-action mt-4 w-full py-3"
        >
          Start both workouts
        </button>
      </div>
    </div>
  );
}

function PersonChoices({
  personId,
  last,
  plans,
  todayPlan,
  workouts,
  value,
  onChange,
}: {
  personId: PersonId;
  last?: Workout;
  plans: CustomPlan[];
  todayPlan?: CustomPlan;
  workouts: Workout[];
  value: StartChoice;
  onChange: (choice: StartChoice) => void;
}) {
  const person = PEOPLE[personId];
  const selectedId =
    value.type === "template"
      ? value.template.id
      : value.type === "plan"
        ? `plan:${value.plan.id}`
        : value.type === "repeat"
          ? "repeat"
          : "empty";
  const extras = plans.filter((plan) => plan.id !== todayPlan?.id).slice(0, 4);

  return (
    <section className={`person-${personId} mb-5`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-2xl">{person.name}</h3>
        <span className="accent-bg grid h-8 w-8 place-items-center rounded-xl text-[10px] font-extrabold text-paper">
          {person.short}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {todayPlan ? (
          <ChoiceButton
            selected={selectedId === `plan:${todayPlan.id}`}
            title={`Today · ${todayPlan.title}`}
            subtitle={`${WEEKDAYS[todayPlan.weekday ?? 0]?.short ?? "Day"} · ${todayPlan.exercises.length} moves`}
            onClick={() => onChange({ type: "plan", plan: todayPlan })}
          />
        ) : null}
        <ChoiceButton
          selected={selectedId === "empty"}
          title="Empty"
          subtitle="Build it as you go"
          onClick={() => onChange({ type: "empty" })}
        />
        {last ? (
          <ChoiceButton
            selected={selectedId === "repeat"}
            title={`Repeat ${last.title}`}
            subtitle="Same exercises and weights"
            onClick={() => onChange({ type: "repeat", workout: last })}
          />
        ) : null}
        {extras.map((plan) => (
          <ChoiceButton
            key={plan.id}
            selected={selectedId === `plan:${plan.id}`}
            title={plan.title}
            subtitle={plan.weekday !== null ? WEEKDAYS[plan.weekday].short : "Custom"}
            onClick={() => onChange({ type: "plan", plan })}
          />
        ))}
        {WORKOUT_TEMPLATES.map((template) => (
          <ChoiceButton
            key={template.id}
            selected={selectedId === template.id}
            title={template.title}
            subtitle={`${template.exercises.length} exercises`}
            onClick={() => onChange({ type: "template", template })}
          />
        ))}
      </div>
      {todayPlan && value.type === "plan" && value.plan.id === todayPlan.id ? (
        <WorkoutProgression
          workouts={workouts}
          personId={personId}
          exercises={todayPlan.exercises}
        />
      ) : null}
    </section>
  );
}

function ChoiceButton({
  selected,
  title,
  subtitle,
  onClick,
}: {
  selected: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3 py-3 text-left ${
        selected ? "accent-soft border-transparent shadow-sm" : "border-line bg-paper"
      }`}
    >
      <span className="font-extrabold">{title}</span>
      <span className="mt-1 block text-xs text-muted">{subtitle}</span>
    </button>
  );
}
