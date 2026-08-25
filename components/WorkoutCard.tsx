import Link from "next/link";
import { AppIcon } from "@/components/AppIcon";
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
    <Link href={destination} className={`person-${workout.personId} surface-card lift-card block p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted">
            <AppIcon name="calendar" className="h-3.5 w-3.5 text-energy" />
            {showPerson ? `${person.name} · ` : ""}
            {formatDateLabel(workout.startedAt)} · {formatTimeLabel(workout.startedAt)}
          </p>
          <h3 className="font-display mt-2 text-2xl leading-tight">{workout.title}</h3>
        </div>
        {live ? (
          <span className="accent-soft accent-text flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            Live now
          </span>
        ) : (
          <span className="accent-bg grid h-9 w-9 place-items-center rounded-xl text-[10px] font-extrabold text-paper">
            {person.short}
          </span>
        )}
      </div>
      <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
        <span className="flex items-center gap-1 rounded-full bg-bg px-2.5 py-1.5">
          <AppIcon name="dumbbell" className="h-3.5 w-3.5" />
          {workout.exercises.length} move{workout.exercises.length === 1 ? "" : "s"}
          {minutes > 0 ? ` · ${minutes} min cardio` : ""}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-bg px-2.5 py-1.5">
          <AppIcon name="timer" className="h-3.5 w-3.5" />
          {total > 0 ? `${done}/${total} sets · ` : ""}
          {formatDuration(workout.startedAt, workout.finishedAt)} · {formatCalories(kcal)}
        </span>
      </div>
    </Link>
  );
}
