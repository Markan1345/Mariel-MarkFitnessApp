"use client";

import { useEffect, useMemo, useState } from "react";
import { ExerciseBlock } from "./ExerciseBlock";
import { ExercisePicker } from "./ExercisePicker";
import {
  addExercise,
  addSet,
  cardioMinutes,
  completedSetCount,
  removeExercise,
  removeSet,
  updateExercise,
  updateSet,
} from "@/lib/store";
import { DEFAULT_BODY_WEIGHT_LB, estimateWorkoutCalories, formatCalories } from "@/lib/calories";
import { formatDuration } from "@/lib/stats";
import type { Workout } from "@/lib/types";

export function WorkoutEditor({
  workout,
  onChange,
  onFinish,
  onDelete,
  finishLabel = "Finish workout",
  bodyWeightLb = DEFAULT_BODY_WEIGHT_LB,
}: {
  workout: Workout;
  onChange: (workout: Workout) => void;
  onFinish?: () => void;
  onDelete?: () => void;
  finishLabel?: string;
  bodyWeightLb?: number;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const live = !workout.finishedAt;

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [live]);

  const duration = useMemo(
    () => formatDuration(workout.startedAt, workout.finishedAt, now),
    [workout.startedAt, workout.finishedAt, now],
  );
  const kcal = estimateWorkoutCalories(workout, bodyWeightLb);
  const minutes = cardioMinutes(workout);
  const sets = completedSetCount(workout);

  return (
    <>
      <input
        value={workout.title}
        onChange={(event) => onChange({ ...workout, title: event.target.value })}
        className="font-display w-full bg-transparent text-4xl leading-none outline-none"
      />
      <p className="mt-2 text-sm text-muted">
        {duration}
        {minutes > 0 ? ` · ${minutes} min cardio` : ""}
        {sets.total > 0 ? ` · ${sets.done}/${sets.total} sets` : ""}
        {` · est. ${formatCalories(kcal)}`}
      </p>
      <textarea
        value={workout.notes}
        onChange={(event) => onChange({ ...workout, notes: event.target.value })}
        placeholder="Session notes"
        className="mt-4 w-full resize-none rounded-2xl border border-line bg-paper px-3 py-2 text-sm"
        rows={2}
      />

      <div className="mt-6 grid gap-3">
        {workout.exercises.map((exercise) => (
          <ExerciseBlock
            key={exercise.id}
            exercise={exercise}
            bodyWeightLb={bodyWeightLb}
            onChange={(next) => onChange(updateExercise(workout, exercise.id, () => next))}
            onAddSet={() => onChange(addSet(workout, exercise.id))}
            onRemove={() => onChange(removeExercise(workout, exercise.id))}
            onUpdateSet={(set) => onChange(updateSet(workout, exercise.id, set.id, () => set))}
            onRemoveSet={(setId) => onChange(removeSet(workout, exercise.id, setId))}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="mt-4 w-full rounded-3xl border border-dashed border-line py-4 font-medium"
      >
        Add lift or cardio
      </button>

      <div className="mt-6 grid gap-2">
        {live && onFinish ? (
          <button
            type="button"
            onClick={() => onFinish()}
            className="accent-bg w-full rounded-3xl py-4 text-lg font-semibold text-paper"
          >
            {finishLabel}
          </button>
        ) : null}
        {!live ? (
          <button
            type="button"
            onClick={() => onChange({ ...workout, finishedAt: null })}
            className="w-full rounded-3xl border border-line bg-paper py-3 font-medium"
          >
            Reopen session
          </button>
        ) : null}
        {onDelete ? (
          confirmDelete ? (
            <button
              type="button"
              onClick={() => onDelete()}
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
          )
        ) : null}
      </div>
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(name, kind) => {
          onChange(addExercise(workout, name, kind));
          setPickerOpen(false);
        }}
      />
    </>
  );
}
