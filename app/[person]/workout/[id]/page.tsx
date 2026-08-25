"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ExerciseBlock } from "@/components/ExerciseBlock";
import { ExercisePicker } from "@/components/ExercisePicker";
import { isPersonId } from "@/lib/people";
import {
  addExercise,
  addSet,
  finishWorkout,
  getWorkout,
  removeExercise,
  removeSet,
  updateExercise,
  updateSet,
} from "@/lib/store";
import { formatDuration } from "@/lib/stats";
import { useFitnessStore } from "@/lib/use-fitness-store";

export default function WorkoutPage({
  params,
}: {
  params: Promise<{ person: string; id: string }>;
}) {
  const { person, id } = use(params);
  const router = useRouter();
  const { state, upsert, remove } = useFitnessStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const workout = isPersonId(person) ? getWorkout(state, id) : undefined;
  const personId = isPersonId(person) ? person : null;

  useEffect(() => {
    if (!workout || workout.finishedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [workout]);

  const duration = useMemo(() => {
    if (!workout) return "0:00";
    return formatDuration(workout.startedAt, workout.finishedAt, now);
  }, [workout, now]);

  if (!personId) return null;

  if (!workout || workout.personId !== personId) {
    return (
      <div className={`person-${personId} min-h-svh px-5 py-10`}>
        <AppHeader personId={personId} title="Workout" backHref={`/${personId}`} />
        <p className="mt-8 text-center text-muted">This session could not be found.</p>
      </div>
    );
  }

  const live = !workout.finishedAt;

  return (
    <div className={`person-${personId} flex min-h-svh flex-col`}>
      <AppHeader personId={personId} title={live ? "Session" : "Details"} backHref={`/${personId}`} />
      <main className="flex-1 px-5 pb-28">
        <input
          value={workout.title}
          onChange={(event) => upsert({ ...workout, title: event.target.value })}
          className="font-display w-full bg-transparent text-4xl leading-none outline-none"
        />
        <p className="mt-2 text-sm text-muted">{duration}</p>
        <textarea
          value={workout.notes}
          onChange={(event) => upsert({ ...workout, notes: event.target.value })}
          placeholder="Session notes"
          className="mt-4 w-full resize-none rounded-2xl border border-line bg-paper px-3 py-2 text-sm"
          rows={2}
        />

        <div className="mt-6 grid gap-3">
          {workout.exercises.map((exercise) => (
            <ExerciseBlock
              key={exercise.id}
              exercise={exercise}
              onChange={(next) => upsert(updateExercise(workout, exercise.id, () => next))}
              onAddSet={() => upsert(addSet(workout, exercise.id))}
              onRemove={() => upsert(removeExercise(workout, exercise.id))}
              onUpdateSet={(set) => upsert(updateSet(workout, exercise.id, set.id, () => set))}
              onRemoveSet={(setId) => upsert(removeSet(workout, exercise.id, setId))}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mt-4 w-full rounded-3xl border border-dashed border-line py-4 font-medium"
        >
          Add exercise
        </button>

        <div className="mt-6 grid gap-2">
          {live ? (
            <button
              type="button"
              onClick={() => {
                upsert(finishWorkout(workout));
                router.push(`/${personId}`);
              }}
              className="accent-bg w-full rounded-3xl py-4 text-lg font-semibold text-paper"
            >
              Finish workout
            </button>
          ) : (
            <button
              type="button"
              onClick={() => upsert({ ...workout, finishedAt: null })}
              className="w-full rounded-3xl border border-line bg-paper py-3 font-medium"
            >
              Reopen session
            </button>
          )}
          {confirmDelete ? (
            <button
              type="button"
              onClick={() => {
                remove(workout.id);
                router.push(`/${personId}`);
              }}
              className="w-full rounded-3xl bg-[#b24a34] py-3 font-medium text-paper"
            >
              Confirm delete
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 text-sm text-muted"
            >
              Delete workout
            </button>
          )}
        </div>
      </main>
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(name) => {
          upsert(addExercise(workout, name));
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
