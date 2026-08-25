"use client";

import { Suspense, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { WorkoutEditor } from "@/components/WorkoutEditor";
import { isPersonId } from "@/lib/people";
import { finishWorkout, getWorkout } from "@/lib/store";
import { useFitnessStore } from "@/lib/use-fitness-store";
import { bodyWeightPounds } from "@/lib/weight";

export default function WorkoutPage({
  params,
}: {
  params: Promise<{ person: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-svh px-5 py-10 text-sm text-muted">Opening workout…</div>}>
      <WorkoutPageInner params={params} />
    </Suspense>
  );
}

function WorkoutPageInner({
  params,
}: {
  params: Promise<{ person: string }>;
}) {
  const { person } = use(params);
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const router = useRouter();
  const { state, upsert, remove } = useFitnessStore();
  const personId = isPersonId(person) ? person : null;
  const workout = personId && id ? getWorkout(state, id) : undefined;

  if (!personId) return null;

  if (!workout || workout.personId !== personId) {
    return (
      <div className={`person-${personId} min-h-svh px-5 py-10`}>
        <AppHeader personId={personId} title="Workout" backHref="/" />
        <p className="mt-8 text-center text-muted">This session could not be found.</p>
      </div>
    );
  }

  const live = !workout.finishedAt;

  return (
    <div className={`person-${personId} flex min-h-svh flex-col`}>
      <AppHeader
        personId={personId}
        title={live ? "Session" : "Details"}
        backHref={live ? `/session?person=${personId}` : "/history"}
      />
      <main className="flex-1 px-5 pb-10">
        <WorkoutEditor
          workout={workout}
          onChange={upsert}
          bodyWeightLb={bodyWeightPounds(state.weights, personId)}
          onFinish={() => {
            upsert(finishWorkout(workout));
            router.push("/");
          }}
          onDelete={() => {
            remove(workout.id);
            router.push("/");
          }}
        />
      </main>
    </div>
  );
}
