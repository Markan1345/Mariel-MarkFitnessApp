"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { StartWorkoutSheet } from "@/components/StartWorkoutSheet";
import { WeekStrip } from "@/components/WeekStrip";
import { WorkoutCard } from "@/components/WorkoutCard";
import { isPersonId, PEOPLE } from "@/lib/people";
import { activeWorkoutForPerson, createWorkout, duplicateWorkout, workoutsForPerson } from "@/lib/store";
import { greeting, workoutsThisWeek } from "@/lib/stats";
import { useFitnessStore } from "@/lib/use-fitness-store";
import type { WorkoutTemplate } from "@/lib/types";

export default function PersonHome({
  params,
}: {
  params: Promise<{ person: string }>;
}) {
  const { person } = use(params);
  const router = useRouter();
  const { state, upsert } = useFitnessStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  if (!isPersonId(person)) return null;
  const personId = person;
  const personWorkouts = workoutsForPerson(state, personId);
  const active = activeWorkoutForPerson(state, personId);
  const recent = personWorkouts.filter((workout) => workout.finishedAt).slice(0, 4);
  const week = workoutsThisWeek(personWorkouts);
  const lastFinished = recent[0];

  function startSession(template?: WorkoutTemplate) {
    const workout = createWorkout({
      personId,
      title: template?.title ?? "Workout",
      exerciseNames: template?.exercises,
    });
    upsert(workout);
    setSheetOpen(false);
    router.push(`/${personId}/workout/${workout.id}`);
  }

  function repeatLast() {
    if (!lastFinished) return;
    const next = duplicateWorkout(lastFinished);
    upsert(next);
    router.push(`/${personId}/workout/${next.id}`);
  }

  return (
    <div className={`person-${personId} flex min-h-svh flex-col`}>
      <AppHeader personId={personId} title="Today" />
      <main className="flex-1 px-5 pb-8">
        <p className="text-sm text-muted" suppressHydrationWarning>
          {greeting(PEOPLE[personId].name)}
        </p>
        <h2 className="font-display mt-1 text-4xl leading-none">Ready when you are.</h2>

        <section className="mt-6 rounded-3xl border border-line bg-paper p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">This week</p>
            <p className="text-sm text-muted">
              {week.length} session{week.length === 1 ? "" : "s"}
            </p>
          </div>
          <WeekStrip workouts={personWorkouts} />
        </section>

        {active ? (
          <button
            type="button"
            onClick={() => router.push(`/${personId}/workout/${active.id}`)}
            className="accent-bg mt-4 w-full rounded-3xl px-4 py-4 text-left text-paper"
          >
            <p className="text-xs tracking-[0.18em] uppercase opacity-80">In progress</p>
            <p className="font-display mt-1 text-2xl">{active.title}</p>
            <p className="mt-1 text-sm opacity-80">Tap to resume</p>
          </button>
        ) : (
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="accent-bg w-full rounded-3xl py-4 text-lg font-semibold text-paper"
            >
              Start workout
            </button>
            {lastFinished ? (
              <button
                type="button"
                onClick={repeatLast}
                className="w-full rounded-3xl border border-line bg-paper py-3 font-medium"
              >
                Repeat {lastFinished.title}
              </button>
            ) : null}
          </div>
        )}

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-2xl">Recent</h3>
            <Link href={`/${personId}/history`} className="text-sm text-muted">
              See all
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line px-4 py-8 text-center">
              <p className="font-display text-2xl">No sessions yet</p>
              <p className="mt-2 text-sm text-muted">
                Your first workout will show up here, with every set you log.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {recent.map((workout) => (
                <WorkoutCard key={workout.id} personId={personId} workout={workout} />
              ))}
            </div>
          )}
        </section>
      </main>
      <BottomNav personId={personId} />
      <StartWorkoutSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onStart={startSession}
      />
    </div>
  );
}
