"use client";

import { SetRow } from "./SetRow";
import { CardioBlock } from "./CardioBlock";
import { AppIcon } from "./AppIcon";
import { estimateExerciseCalories, formatCalories } from "@/lib/calories";
import { kindForExercise } from "@/lib/exercises";
import type { ExerciseEntry, SetEntry } from "@/lib/types";

export function ExerciseBlock({
  exercise,
  bodyWeightLb,
  onChange,
  onAddSet,
  onRemove,
  onUpdateSet,
  onRemoveSet,
}: {
  exercise: ExerciseEntry;
  bodyWeightLb: number;
  onChange: (exercise: ExerciseEntry) => void;
  onAddSet: () => void;
  onRemove: () => void;
  onUpdateSet: (set: SetEntry) => void;
  onRemoveSet: (setId: string) => void;
}) {
  if ((exercise.kind ?? kindForExercise(exercise.name)) === "cardio") {
    return (
      <CardioBlock
        exercise={exercise}
        bodyWeightLb={bodyWeightLb}
        onChange={onChange}
        onRemove={onRemove}
      />
    );
  }

  const kcal = Math.round(estimateExerciseCalories(exercise, bodyWeightLb));

  return (
    <section className="surface-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="accent-soft accent-text grid h-10 w-10 shrink-0 place-items-center rounded-2xl">
            <AppIcon name="dumbbell" className="h-5 w-5" />
          </span>
          <div>
            <p className="eyebrow">Strength</p>
            <h3 className="font-display text-2xl leading-tight">{exercise.name}</h3>
            {kcal > 0 ? <p className="mt-1 text-xs font-bold text-muted">Est. {formatCalories(kcal)}</p> : null}
          </div>
        </div>
        <button type="button" onClick={onRemove} className="text-xs text-muted">
          Remove
        </button>
      </div>
      <div className="divide-y divide-line/80">
        {exercise.sets.map((set, index) => (
          <SetRow
            key={set.id}
            index={index}
            set={set}
            onChange={onUpdateSet}
            onRemove={() => onRemoveSet(set.id)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onAddSet}
        className="accent-soft accent-text mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-extrabold"
      >
        <AppIcon name="plus" className="h-4 w-4" />
        Add set
      </button>
      <input
        value={exercise.notes}
        onChange={(event) => onChange({ ...exercise, notes: event.target.value })}
        placeholder="Notes for this exercise"
        className="input-shell mt-3 w-full px-3 py-2 text-sm"
      />
    </section>
  );
}
