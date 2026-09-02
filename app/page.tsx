"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { AppIcon, type AppIconName } from "@/components/AppIcon";
import { TogetherStartSheet, type StartChoice } from "@/components/TogetherStartSheet";
import { WeekStrip } from "@/components/WeekStrip";
import { WorkoutCard } from "@/components/WorkoutCard";
import { TodayStepStats } from "@/components/TodayStepStats";
import { WorkoutProgression } from "@/components/WorkoutProgression";
import { PEOPLE, PERSON_IDS } from "@/lib/people";
import {
  activeWorkoutForPerson,
  linkWorkouts,
  workoutsForPerson,
} from "@/lib/store";
import { planForDate, workoutPlanForDate } from "@/lib/programs";
import { workoutFromChoice } from "@/lib/start";
import { workoutHref } from "@/lib/routes";
import { groupWorkoutsByDay, workoutsThisWeek } from "@/lib/stats";
import { useFitnessStore } from "@/lib/use-fitness-store";
import { bodyWeightPounds, latestWeight } from "@/lib/weight";
import type { PersonId, Workout } from "@/lib/types";

export default function TogetherHome() {
  const router = useRouter();
  const { state, upsertMany } = useFitnessStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const live: Record<PersonId, Workout | undefined> = {
    mark: activeWorkoutForPerson(state, "mark"),
    mariel: activeWorkoutForPerson(state, "mariel"),
  };
  const last: Partial<Record<PersonId, Workout>> = {
    mark: workoutsForPerson(state, "mark").find((workout) => workout.finishedAt),
    mariel: workoutsForPerson(state, "mariel").find((workout) => workout.finishedAt),
  };
  const anyLive = Boolean(live.mark || live.mariel);
  const recentDays = groupWorkoutsByDay(state.workouts).slice(0, 4);

  function startBoth(choices: Record<PersonId, StartChoice>) {
    const mark = live.mark ?? workoutFromChoice("mark", choices.mark);
    const mariel = live.mariel ?? workoutFromChoice("mariel", choices.mariel);
    upsertMany(linkWorkouts(mark, mariel));
    setSheetOpen(false);
    router.push("/session");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Lifting Together</p>
            <h1 className="font-display mt-1 text-[2.65rem] leading-none">Ready to move?</h1>
            <p className="mt-2 text-sm font-medium text-muted">Mark &amp; Mariel&apos;s training hub</p>
          </div>
          <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-ink text-lg font-black tracking-[-0.08em] text-paper shadow-[0_8px_18px_rgba(39,27,18,0.2)]">
            LT
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sun" />
            <span className="absolute right-2 bottom-1.5 left-2 h-0.5 rounded-full bg-energy" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(
            [
              { href: "/account", label: "Account", detail: "Profile & login", icon: "user" },
              { href: "/plans", label: "Plan", detail: "Your week", icon: "calendar" },
              { href: "/steps", label: "Steps", detail: "Day, week & month", icon: "steps" },
              { href: "/weight", label: "Weight", detail: "Body & lifts", icon: "scale" },
              { href: "/history", label: "History", detail: "Past lifts", icon: "history" },
              { href: "/sync", label: "Sync", detail: "Phone & desktop", icon: "spark" },
            ] as { href: string; label: string; detail: string; icon: AppIconName }[]
          ).map((item) => (
            <Link key={item.href} href={item.href} className="surface-card px-3 py-3">
              <AppIcon name={item.icon} className="h-5 w-5 text-energy" />
              <span className="mt-2 block text-sm font-extrabold">{item.label}</span>
              <span className="mt-0.5 block text-[10px] font-medium text-muted">{item.detail}</span>
            </Link>
          ))}
        </div>
      </header>

      <main className="flex-1 px-5 pb-8">
        {anyLive ? (
          <Link href="/session" className="primary-action flex items-center justify-between px-5 py-4">
            <span>
              <span className="flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase opacity-75">
                <span className="h-2 w-2 animate-pulse rounded-full bg-sun" />
                Workout in progress
              </span>
              <span className="font-display mt-1 block text-2xl">Resume session</span>
              <span className="mt-1 block text-xs font-medium opacity-70">
                {[live.mark && `Mark · ${live.mark.title}`, live.mariel && `Mariel · ${live.mariel.title}`]
                  .filter(Boolean)
                  .join("  ·  ")}
              </span>
            </span>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-paper/10">
              <AppIcon name="chevron-right" className="h-5 w-5" />
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="primary-action flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <span>
              <span className="text-[11px] tracking-[0.16em] uppercase opacity-70">Today&apos;s session</span>
              <span className="font-display mt-1 block text-2xl">Start both workouts</span>
            </span>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sun text-ink">
              <AppIcon name="dumbbell" className="h-6 w-6" />
            </span>
          </button>
        )}

        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="eyebrow">Training team</p>
            <h2 className="font-display text-2xl">This week</h2>
          </div>
          <span className="rounded-full bg-sun/40 px-3 py-1.5 text-xs font-extrabold text-gold">
            Keep showing up
          </span>
        </div>
        <div className="mt-3 grid gap-3">
          {PERSON_IDS.map((id) => {
            const person = PEOPLE[id];
            const workouts = workoutsForPerson(state, id);
            const week = workoutsThisWeek(workouts);
            const current = live[id];
            const todayPlan = planForDate(state.plans, id, new Date());
            const todayWorkout = workoutPlanForDate(state.plans, id, new Date());
            const latestLb = latestWeight(state.weights, id);
            return (
              <section key={id} className={`person-${id} surface-card lift-card p-4`}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="accent-bg grid h-11 w-11 place-items-center rounded-2xl text-xs font-extrabold text-paper shadow-sm">
                      {person.short}
                    </span>
                    <div>
                      <h3 className="font-display text-2xl leading-none">{person.name}</h3>
                      <p className="mt-1 text-xs font-medium text-muted">
                        {todayPlan
                          ? todayPlan.kind === "rest"
                            ? "Today · Rest day"
                            : `Today · ${todayPlan.title}`
                          : "Plan today’s workout"}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 text-right">
                    <p className="font-display text-2xl leading-none">{week.length}</p>
                    <p className="text-[10px] font-bold tracking-wide text-muted uppercase">sessions</p>
                  </div>
                </div>
                <WeekStrip workouts={workouts} plans={state.plans} personId={id} />
                <TodayStepStats state={state} personId={id} />
                {todayWorkout ? (
                  <WorkoutProgression
                    workouts={state.workouts}
                    personId={id}
                    exercises={todayWorkout.exercises}
                  />
                ) : last[id] ? (
                  <WorkoutProgression
                    workouts={state.workouts}
                    personId={id}
                    exercises={last[id]!.exercises.map((exercise) => ({
                      name: exercise.name,
                      kind: exercise.kind ?? "strength",
                    }))}
                  />
                ) : null}
                {latestLb ? (
                  <p className="relative z-10 mt-3 flex items-center gap-1.5 text-xs font-bold text-muted">
                    <AppIcon name="scale" className="h-3.5 w-3.5" />
                    Latest {latestLb.pounds} lb
                  </p>
                ) : null}
                {current ? (
                  <Link
                    href={`/session?person=${id}`}
                    className="accent-action relative z-10 mt-3 flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span>Resume {current.title}</span>
                    <AppIcon name="chevron-right" className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link href={`/${id}`} className="relative z-10 mt-3 flex items-center justify-between border-t border-line/70 pt-3 text-sm font-bold">
                    <span>Open {person.name}&apos;s dashboard</span>
                    <AppIcon name="chevron-right" className="h-4 w-4 text-muted" />
                  </Link>
                )}
              </section>
            );
          })}
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="eyebrow">Activity</p>
              <h3 className="font-display text-2xl">Recent workouts</h3>
            </div>
            <Link href="/history" className="flex items-center gap-1 text-sm font-bold text-energy">
              See all <AppIcon name="chevron-right" className="h-4 w-4" />
            </Link>
          </div>
          {recentDays.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line px-4 py-8 text-center">
              <p className="font-display text-2xl">No sessions yet</p>
              <p className="mt-2 text-sm text-muted">
                Start both workouts and log each person&apos;s sets as you go.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {recentDays.map((day) => (
                <div key={day.key} className="grid gap-2">
                  <p className="text-xs tracking-[0.16em] text-muted uppercase" suppressHydrationWarning>
                    {day.date.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  {day.workouts.map((workout) => (
                    <WorkoutCard
                      key={workout.id}
                      workout={workout}
                      showPerson
                      bodyWeightLb={bodyWeightPounds(state.weights, workout.personId)}
                      href={
                        workout.finishedAt
                          ? workoutHref(workout.personId, workout.id)
                          : `/session?person=${workout.personId}`
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <AppNav />
      <TogetherStartSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        lastWorkouts={last}
        plans={state.plans}
        workouts={state.workouts}
        onStart={startBoth}
      />
    </div>
  );
}
