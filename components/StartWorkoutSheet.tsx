"use client";

import { WORKOUT_TEMPLATES } from "@/lib/exercises";
import type { WorkoutTemplate } from "@/lib/types";

export function StartWorkoutSheet({
  open,
  onClose,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  onStart: (template?: WorkoutTemplate) => void;
}) {
  if (!open) return null;
  const now = new Date();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-3 sm:items-center">
      <div className="w-full max-w-[430px] rounded-3xl bg-paper p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl">New session</h2>
          <button type="button" onClick={onClose} className="text-sm text-muted">
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <button
          type="button"
          onClick={() => onStart()}
          className="accent-bg mt-5 w-full rounded-2xl py-3 font-semibold text-paper"
        >
          Start empty workout
        </button>
        <p className="mt-5 text-xs tracking-[0.18em] text-muted uppercase">Or use a template</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {WORKOUT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onStart(template)}
              className="rounded-2xl border border-line bg-bg px-3 py-3 text-left"
            >
              <span className="font-medium">{template.title}</span>
              <span className="mt-1 block text-xs text-muted">
                {template.exercises.length} exercises
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
