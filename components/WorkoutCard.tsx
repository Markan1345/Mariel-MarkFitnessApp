import Link from "next/link";
import { cardioMinutes, completedSetCount } from "@/lib/store";
import { DEFAULT_BODY_WEIGHT_LB, estimateWorkoutCalories, formatCalories } from "@/lib/calories";
import { formatDateLabel, formatDuration, formatTimeLabel } from "@/lib/stats";
import { PEOPLE } from "@/lib/people";
import { workoutHref } from "@/lib/routes";
import type { Workout } from "@/lib/types";

export function WorkoutCard({
  workout,
  href,
  showPerson = false,
  bodyWeightLb = DEFAULT_BODY_WEIGHT_LB,
}: {
  workout: Workout;
  href?: string;
  showPerson?: boolean;
  bodyWeightLb?: number;
}) {
  const { done, total } = completedSetCount(workout);
  const minutes = cardioMinutes(workout);
  const kcal = estimateWorkoutCalories(workout, bodyWeightLb);
  const live = !workout.finishedAt;
  const person = PEOPLE[workout.personId];
  const destination = href ?? workoutHref(workout.personId, workout.id);

  return (
    <Link href={destination} className={`person-${workout.personId} block rounded-3xl border border-line bg-paper p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">
            {showPerson ? `${person.name} · ` : ""}
            {formatDateLabel(workout.startedAt)} · {formatTimeLabel(workout.startedAt)}
          </p>
          <h3 className="font-display mt-1 text-2xl leading-tight">{workout.title}</h3>
        </div>
        {live ? (
          <span className="accent-soft accent-text rounded-full px-2.5 py-1 text-xs font-semibold">
            Live
          </span>
        ) : (
          <span className="accent-bg grid h-8 w-8 place-items-center rounded-full text-[10px] font-semibold text-paper">
            {person.short}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-muted">
        <span>
          {workout.exercises.length} move{workout.exercises.length === 1 ? "" : "s"}
          {minutes > 0 ? ` · ${minutes} min cardio` : ""}
        </span>
        <span>
          {total > 0 ? `${done}/${total} sets · ` : ""}
          {formatDuration(workout.startedAt, workout.finishedAt)} · {formatCalories(kcal)}
        </span>
      </div>
    </Link>
  );
}
