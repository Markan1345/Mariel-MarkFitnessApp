"use client";

import { NumberStepper } from "./NumberStepper";
import type { SetEntry } from "@/lib/types";

export function SetRow({
  index,
  set,
  onChange,
  onRemove,
}: {
  index: number;
  set: SetEntry;
  onChange: (set: SetEntry) => void;
  onRemove: () => void;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-extrabold">
          <span className="accent-soft accent-text grid h-7 w-7 place-items-center rounded-lg text-xs">
            {index + 1}
          </span>
          Set
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...set, completed: !set.completed })}
            className={`grid h-9 min-w-9 place-items-center rounded-xl px-3 text-sm font-extrabold ${
              set.completed ? "accent-bg text-paper shadow-sm" : "bg-bg text-muted"
            }`}
            aria-label={set.completed ? "Mark set incomplete" : "Complete set"}
          >
            {set.completed ? "Done" : "Log"}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-muted"
            aria-label="Remove set"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <label className="text-xs tracking-[0.14em] text-muted uppercase">
          Weight
          <div className="mt-1">
            <NumberStepper
              value={set.weight}
              step={5}
              suffix="lb"
              onChange={(weight) => onChange({ ...set, weight })}
            />
          </div>
        </label>
        <label className="text-xs tracking-[0.14em] text-muted uppercase">
          Reps
          <div className="mt-1">
            <NumberStepper
              value={set.reps}
              step={1}
              onChange={(reps) => onChange({ ...set, reps })}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
