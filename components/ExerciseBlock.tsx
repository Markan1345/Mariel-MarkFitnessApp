"use client";

import { SetRow } from "./SetRow";
import type { ExerciseEntry, SetEntry } from "@/lib/types";

export function ExerciseBlock({
  exercise,
  onChange,
  onAddSet,
  onRemove,
  onUpdateSet,
  onRemoveSet,
}: {
  exercise: ExerciseEntry;
  onChange: (exercise: ExerciseEntry) => void;
  onAddSet: () => void;
  onRemove: () => void;
  onUpdateSet: (set: SetEntry) => void;
  onRemoveSet: (setId: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-line bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-2xl leading-tight">{exercise.name}</h3>
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
        className="mt-2 w-full rounded-2xl bg-line/60 py-2 text-sm font-medium"
      >
        Add set
      </button>
      <input
        value={exercise.notes}
        onChange={(event) => onChange({ ...exercise, notes: event.target.value })}
        placeholder="Notes for this exercise"
        className="mt-3 w-full rounded-2xl border border-line bg-bg px-3 py-2 text-sm"
      />
    </section>
  );
}
