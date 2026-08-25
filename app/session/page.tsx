"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { PersonTabs } from "@/components/PersonTabs";
import { WorkoutEditor } from "@/components/WorkoutEditor";
import { WORKOUT_TEMPLATES } from "@/lib/exercises";
import { isPersonId, PEOPLE } from "@/lib/people";
import { isWeekday, planForWeekday, plansForPerson } from "@/lib/programs";
import { activeWorkoutForPerson, finishWorkout, linkWorkouts, workoutsForPerson } from "@/lib/store";
import { workoutFromChoice } from "@/lib/start";
import { useFitnessStore } from "@/lib/use-fitness-store";
import { bodyWeightPounds } from "@/lib/weight";
import type { CustomPlan, PersonId, WorkoutTemplate } from "@/lib/types";

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="min-h-svh px-5 py-10 text-sm text-muted">Opening session…</div>}>
      <SessionPageInner />
    </Suspense>
  );
}

function SessionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, upsert, upsertMany } = useFitnessStore();
  const requested = searchParams.get("person");
  const [tab, setTab] = useState<PersonId>("mark");
  const active: PersonId = requested && isPersonId(requested) ? requested : tab;

  const live = {
    mark: activeWorkoutForPerson(state, "mark"),
    mariel: activeWorkoutForPerson(state, "mariel"),
  };
  const workout = live[active];
  const person = PEOPLE[active];
  const last = workoutsForPerson(state, active).find((item) => item.finishedAt);

  function startForActive(choice: Parameters<typeof workoutFromChoice>[1]) {
    const created = workoutFromChoice(active, choice);
    const other = active === "mark" ? live.mariel : live.mark;
    if (other) {
      upsertMany(linkWorkouts(created, other));
    } else {
      upsert(created);
    }
  }

  function finishActive() {
    if (!workout) return;
    upsert(finishWorkout(workout));
    const otherId: PersonId = active === "mark" ? "mariel" : "mark";
    if (live[otherId]) {
      router.replace(`/session?person=${otherId}`, { scroll: false });
      return;
    }
    router.push("/");
  }

  function finishBoth() {
    const next = [live.mark, live.mariel].filter((item) => Boolean(item)).map((item) => finishWorkout(item!));
    if (next.length) upsertMany(next);
    router.push("/");
  }

  return (
    <div className={`person-${active} flex min-h-svh flex-col`}>
      <header className="px-5 pt-6 pb-3">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-muted">
            Home
          </Link>
          <p className="text-[11px] tracking-[0.2em] text-muted uppercase">Live session</p>
          <span className="accent-bg grid h-8 w-8 place-items-center rounded-full text-[10px] font-semibold text-paper">
            {person.short}
          </span>
        </div>
        <PersonTabs
          active={active}
          onChange={(personId) => {
            setTab(personId);
            router.replace(`/session?person=${personId}`, { scroll: false });
          }}
          live={{ mark: Boolean(live.mark), mariel: Boolean(live.mariel) }}
        />
      </header>
      <main className="flex-1 px-5 pb-28">
        {workout ? (
          <>
            <WorkoutEditor
              workout={workout}
              onChange={upsert}
              onFinish={finishActive}
              finishLabel={`Finish ${person.name}`}
              bodyWeightLb={bodyWeightPounds(state.weights, active)}
            />
            {live.mark && live.mariel ? (
              <button
                type="button"
                onClick={finishBoth}
                className="mt-2 w-full rounded-3xl border border-line bg-paper py-3 font-medium"
              >
                Finish both
              </button>
            ) : null}
          </>
        ) : (
          <EmptyPersonStart
            personId={active}
            lastTitle={last?.title}
            todayPlan={(() => {
              const day = new Date().getDay();
              return isWeekday(day) ? planForWeekday(state.plans, active, day) : undefined;
            })()}
            customPlans={plansForPerson(state.plans, active).slice(0, 4)}
            onStartEmpty={() => startForActive({ type: "empty" })}
            onRepeat={last ? () => startForActive({ type: "repeat", workout: last }) : undefined}
            onTemplate={(template) => startForActive({ type: "template", template })}
            onPlan={(plan) => startForActive({ type: "plan", plan })}
          />
        )}
      </main>
      <AppNav />
    </div>
  );
}

function EmptyPersonStart({
  personId,
  lastTitle,
  todayPlan,
  customPlans,
  onStartEmpty,
  onRepeat,
  onTemplate,
  onPlan,
}: {
  personId: PersonId;
  lastTitle?: string;
  todayPlan?: CustomPlan;
  customPlans: CustomPlan[];
  onStartEmpty: () => void;
  onRepeat?: () => void;
  onTemplate: (template: WorkoutTemplate) => void;
  onPlan: (plan: CustomPlan) => void;
}) {
  const person = PEOPLE[personId];
  const otherName = personId === "mark" ? "Mariel" : "Mark";
  return (
    <div className="pt-4">
      <h2 className="font-display text-4xl leading-none">{person.name} isn&apos;t lifting yet</h2>
      <p className="mt-3 text-sm text-muted">
        Start today&apos;s custom workout, cardio, or a lifting template without leaving {otherName}.
      </p>
      {todayPlan ? (
        <button
          type="button"
          onClick={() => onPlan(todayPlan)}
          className="accent-bg mt-5 w-full rounded-3xl py-4 font-semibold text-paper"
        >
          Start today · {todayPlan.title}
        </button>
      ) : (
        <button
          type="button"
          onClick={onStartEmpty}
          className="accent-bg mt-5 w-full rounded-3xl py-4 font-semibold text-paper"
        >
          Start empty workout
        </button>
      )}
      {todayPlan ? (
        <button
          type="button"
          onClick={onStartEmpty}
          className="mt-2 w-full rounded-3xl border border-line bg-paper py-3 font-medium"
        >
          Start empty workout
        </button>
      ) : null}
      {onRepeat ? (
        <button
          type="button"
          onClick={onRepeat}
          className="mt-2 w-full rounded-3xl border border-line bg-paper py-3 font-medium"
        >
          Repeat {lastTitle}
        </button>
      ) : null}
      {customPlans.length > 0 ? (
        <>
          <p className="mt-5 text-xs tracking-[0.18em] text-muted uppercase">Custom days</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {customPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => onPlan(plan)}
                className="rounded-2xl border border-line bg-paper px-3 py-3 text-left"
              >
                <span className="font-medium">{plan.title}</span>
                <span className="mt-1 block text-xs text-muted">{plan.exercises.length} moves</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
      <p className="mt-5 text-xs tracking-[0.18em] text-muted uppercase">Templates</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {WORKOUT_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onTemplate(template)}
            className="rounded-2xl border border-line bg-paper px-3 py-3 text-left"
          >
            <span className="font-medium">{template.title}</span>
            <span className="mt-1 block text-xs text-muted">{template.exercises.length} exercises</span>
          </button>
        ))}
      </div>
    </div>
  );
}
