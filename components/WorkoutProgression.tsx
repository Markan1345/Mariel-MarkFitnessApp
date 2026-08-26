import { lastLiftsForPlan } from "@/lib/progression";
import type { PersonId, PlannedExercise, Workout } from "@/lib/types";

export function WorkoutProgression({
  workouts,
  personId,
  exercises,
  excludeWorkoutId,
}: {
  workouts: Workout[];
  personId: PersonId;
  exercises: PlannedExercise[];
  excludeWorkoutId?: string;
}) {
  const rows = lastLiftsForPlan(workouts, personId, exercises, { excludeWorkoutId });
  if (rows.length === 0) return null;

  return (
    <div className="mt-3 rounded-2xl border border-line/80 bg-bg/60 px-3 py-2.5">
      <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">Last weights</p>
      <ul className="mt-2 space-y-1.5">
        {rows.map(({ exercise, last }) => (
          <li key={exercise.name} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{exercise.name}</span>
            {last ? (
              <span className="shrink-0 text-xs font-bold text-muted">
                {last.weight} lb ·{" "}
                {new Date(last.liftedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            ) : (
              <span className="shrink-0 text-xs font-bold text-muted">No log yet</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
