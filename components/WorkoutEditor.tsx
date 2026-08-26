"use client";

import { useEffect, useMemo, useState } from "react";
import { AppIcon } from "./AppIcon";
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
import { lastLiftForExercise } from "@/lib/progression";
import { formatDuration } from "@/lib/stats";
import type { Workout } from "@/lib/types";

export function WorkoutEditor({
  workout,
  workouts = [],
  onChange,
  onFinish,
  onDelete,
  finishLabel = "Finish workout",
  bodyWeightLb = DEFAULT_BODY_WEIGHT_LB,
}: {
  workout: Workout;
  workouts?: Workout[];
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
      <p className="eyebrow">Live workout</p>
      <input
        value={workout.title}
        onChange={(event) => onChange({ ...workout, title: event.target.value })}
        className="font-display mt-1 w-full bg-transparent text-4xl leading-none outline-none"
      />
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-extrabold text-muted">
        <span className="flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 shadow-sm">
          <AppIcon name="timer" className="h-3.5 w-3.5 text-energy" />
          {duration}
        </span>
        {minutes > 0 ? (
          <span className="flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 shadow-sm">
            <AppIcon name="activity" className="h-3.5 w-3.5 text-energy" />
            {minutes} min cardio
          </span>
        ) : null}
        {sets.total > 0 ? (
          <span className="flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 shadow-sm">
            <AppIcon name="dumbbell" className="h-3.5 w-3.5 text-energy" />
            {sets.done}/{sets.total} sets
          </span>
        ) : null}
        <span className="flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 shadow-sm">
          <AppIcon name="spark" className="h-3.5 w-3.5 text-energy" />
          est. {formatCalories(kcal)}
        </span>
      </div>
      <textarea
        value={workout.notes}
        onChange={(event) => onChange({ ...workout, notes: event.target.value })}
        placeholder="Session notes"
        className="input-shell mt-4 w-full resize-none px-3 py-2 text-sm"
        rows={2}
      />

      <div className="mt-6 grid gap-3">
        {workout.exercises.map((exercise) => (
          <ExerciseBlock
            key={exercise.id}
            exercise={exercise}
            bodyWeightLb={bodyWeightLb}
            lastLift={lastLiftForExercise(workouts, workout.personId, exercise.name, {
              excludeWorkoutId: workout.finishedAt ? undefined : workout.id,
            })}
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
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed border-energy/40 bg-energy/5 py-4 font-extrabold text-energy"
      >
        <AppIcon name="plus" className="h-5 w-5" />
        Add lift or cardio
      </button>

      <div className="mt-6 grid gap-2">
        {live && onFinish ? (
          <button
            type="button"
            onClick={() => onFinish()}
            className="accent-action w-full py-4 text-lg"
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
