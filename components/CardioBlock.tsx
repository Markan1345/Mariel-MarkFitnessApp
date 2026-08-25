"use client";

import { NumberStepper } from "./NumberStepper";
import { estimateExerciseCalories, formatCalories } from "@/lib/calories";
import type { CardioIntensity, ExerciseEntry } from "@/lib/types";

const INTENSITIES: CardioIntensity[] = ["easy", "moderate", "hard"];

export function CardioBlock({
  exercise,
  bodyWeightLb,
  onChange,
  onRemove,
}: {
  exercise: ExerciseEntry;
  bodyWeightLb: number;
  onChange: (exercise: ExerciseEntry) => void;
  onRemove: () => void;
}) {
  const cardio = exercise.cardio ?? { minutes: 20, distanceMiles: null, intensity: "moderate" as const };
  const kcal = Math.round(estimateExerciseCalories({ ...exercise, cardio }, bodyWeightLb));

  function update(partial: Partial<typeof cardio>) {
    onChange({ ...exercise, cardio: { ...cardio, ...partial } });
  }

  return (
    <section className="rounded-3xl border border-line bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Cardio</p>
          <h3 className="font-display text-2xl leading-tight">{exercise.name}</h3>
        </div>
        <button type="button" onClick={onRemove} className="text-xs text-muted">
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
      <p className="mt-3 text-sm text-muted">Est. {formatCalories(kcal)}</p>
      <input
        value={exercise.notes}
        onChange={(event) => onChange({ ...exercise, notes: event.target.value })}
        placeholder="Notes for this cardio"
        className="mt-3 w-full rounded-2xl border border-line bg-bg px-3 py-2 text-sm"
      />
    </section>
  );
}
