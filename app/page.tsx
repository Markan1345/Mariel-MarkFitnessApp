"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { TogetherStartSheet, type StartChoice } from "@/components/TogetherStartSheet";
import { WeekStrip } from "@/components/WeekStrip";
import { WorkoutCard } from "@/components/WorkoutCard";
import { PEOPLE, PERSON_IDS } from "@/lib/people";
import {
  activeWorkoutForPerson,
  linkWorkouts,
  workoutsForPerson,
} from "@/lib/store";
import { workoutFromChoice } from "@/lib/start";
import { groupWorkoutsByDay, workoutsThisWeek } from "@/lib/stats";
import { useFitnessStore } from "@/lib/use-fitness-store";
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
      <header className="px-5 pt-8 pb-3">
        <p className="text-sm tracking-[0.22em] text-muted uppercase">Together</p>
        <h1 className="font-display mt-2 text-4xl leading-none">Mark &amp; Mariel</h1>
        <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-muted">
          Log both sessions at once. Different days, different lifts, same screen.
        </p>
      </header>

      <main className="flex-1 px-5 pb-8">
        {anyLive ? (
          <Link href="/session" className="mt-2 block rounded-3xl bg-ink px-4 py-4 text-paper">
            <p className="text-xs tracking-[0.18em] uppercase opacity-80">In progress</p>
            <p className="font-display mt-1 text-2xl">Resume both</p>
            <p className="mt-1 text-sm opacity-80">
              {[live.mark && `Mark · ${live.mark.title}`, live.mariel && `Mariel · ${live.mariel.title}`]
                .filter(Boolean)
                .join("  ·  ")}
            </p>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mt-2 w-full rounded-3xl bg-ink py-4 text-lg font-semibold text-paper"
          >
            Start both workouts
          </button>
        )}

        <div className="mt-4 grid gap-3">
          {PERSON_IDS.map((id) => {
            const person = PEOPLE[id];
            const workouts = workoutsForPerson(state, id);
            const week = workoutsThisWeek(workouts);
            const current = live[id];
            return (
              <section key={id} className={`person-${id} rounded-3xl border border-line bg-paper p-4`}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-2xl">{person.name}</h2>
                    <p className="text-sm text-muted">
                      {week.length} session{week.length === 1 ? "" : "s"} this week
                    </p>
                  </div>
                  <span className="accent-bg grid h-9 w-9 place-items-center rounded-full text-[10px] font-semibold text-paper">
                    {person.short}
                  </span>
                </div>
                <WeekStrip workouts={workouts} />
                {current ? (
                  <Link
                    href={`/session?person=${id}`}
                    className="accent-bg mt-3 block rounded-2xl px-3 py-3 text-sm font-medium text-paper"
                  >
                    Resume {current.title}
                  </Link>
                ) : (
                  <Link href={`/${id}`} className="mt-3 block text-sm text-muted">
                    Open {person.name}&apos;s log
                  </Link>
                )}
              </section>
            );
          })}
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-2xl">Recent</h3>
            <Link href="/history" className="text-sm text-muted">
              See all
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
                      href={
                        workout.finishedAt
                          ? `/${workout.personId}/workout/${workout.id}`
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
        onStart={startBoth}
      />
    </div>
  );
}
