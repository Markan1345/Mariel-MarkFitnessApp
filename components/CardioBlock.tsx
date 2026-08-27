"use client";

import type { ReactNode } from "react";
import { NumberStepper } from "./NumberStepper";
import { AppIcon } from "./AppIcon";
import { estimateExerciseCalories, formatCalories } from "@/lib/calories";
import { formatSteps, normalizeCardio } from "@/lib/store";
import type { CardioIntensity, ExerciseEntry } from "@/lib/types";

const INTENSITIES: CardioIntensity[] = ["easy", "moderate", "hard"];

export function CardioBlock({
  exercise,
  bodyWeightLb,
  dragHandle,
  onChange,
  onRemove,
}: {
  exercise: ExerciseEntry;
  bodyWeightLb: number;
  dragHandle?: ReactNode;
  onChange: (exercise: ExerciseEntry) => void;
  onRemove: () => void;
}) {
  const cardio = normalizeCardio(exercise.cardio);
  const kcal = Math.round(estimateExerciseCalories({ ...exercise, cardio }, bodyWeightLb));
  const fromSteps = (cardio.minutes ?? 0) <= 0 && (cardio.steps ?? 0) > 0;

  function update(partial: Partial<typeof cardio>) {
    onChange({ ...exercise, cardio: { ...cardio, ...partial } });
  }

  return (
    <section className="surface-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {dragHandle}
          <span className="accent-soft accent-text grid h-10 w-10 shrink-0 place-items-center rounded-2xl">
            <AppIcon name="activity" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">Cardio</p>
            <h3 className="font-display text-2xl leading-tight">{exercise.name}</h3>
          </div>
        </div>
        <button type="button" onClick={onRemove} className="shrink-0 text-xs text-muted">
          Remove
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-xs tracking-[0.14em] text-muted uppercase">
          Minutes
          <div className="mt-1">
            <NumberStepper
              value={cardio.minutes}
              step={5}
              suffix="min"
              onChange={(minutes) => update({ minutes })}
            />
          </div>
        </label>
        <label className="text-xs tracking-[0.14em] text-muted uppercase">
          Distance
          <div className="mt-1">
            <NumberStepper
              value={cardio.distanceMiles}
              step={0.1}
              suffix="mi"
              onChange={(distanceMiles) => update({ distanceMiles })}
            />
          </div>
        </label>
      </div>
      <label className="mt-3 block text-xs tracking-[0.14em] text-muted uppercase">
        Steps
        <div className="mt-1">
          <NumberStepper
            value={cardio.steps}
            step={100}
            suffix="steps"
            wide
            onChange={(steps) => update({ steps: steps == null ? null : Math.round(steps) })}
          />
        </div>
      </label>
      <div className="mt-3 flex gap-1">
        {INTENSITIES.map((intensity) => (
          <button
            key={intensity}
            type="button"
            onClick={() => update({ intensity })}
            className={`flex-1 rounded-full py-2 text-sm capitalize ${
              cardio.intensity === intensity ? "accent-bg text-paper" : "bg-line/70"
            }`}
          >
            {intensity}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">
        Est. {formatCalories(kcal)}
        {fromSteps && cardio.steps ? ` from ${formatSteps(cardio.steps)}` : ""}
      </p>
      <input
        value={exercise.notes}
        onChange={(event) => onChange({ ...exercise, notes: event.target.value })}
        placeholder="Notes for this cardio"
        className="input-shell mt-3 w-full px-3 py-2 text-sm"
      />
    </section>
  );
}
