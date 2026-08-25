"use client";

import { use } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { WorkoutCard } from "@/components/WorkoutCard";
import { isPersonId } from "@/lib/people";
import { workoutsForPerson } from "@/lib/store";
import { useFitnessStore } from "@/lib/use-fitness-store";

export default function HistoryPage({
  params,
}: {
  params: Promise<{ person: string }>;
}) {
  const { person } = use(params);
  const { state } = useFitnessStore();
  if (!isPersonId(person)) return null;
  const personId = person;
  const workouts = workoutsForPerson(state, personId);

  return (
    <div className={`person-${personId} flex min-h-svh flex-col`}>
      <AppHeader personId={personId} title="History" />
      <main className="flex-1 px-5 pb-8">
        {workouts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line px-4 py-10 text-center">
            <p className="font-display text-3xl">Still a blank page</p>
            <p className="mt-2 text-sm text-muted">
              Finished workouts will collect here so you can look back or repeat them.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {workouts.map((workout) => (
              <WorkoutCard key={workout.id} personId={personId} workout={workout} />
            ))}
          </div>
        )}
      </main>
      <BottomNav personId={personId} />
    </div>
  );
}
