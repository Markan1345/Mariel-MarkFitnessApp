import Link from "next/link";
import { completedSetCount } from "@/lib/store";
import { formatDateLabel, formatDuration, formatTimeLabel } from "@/lib/stats";
import type { PersonId, Workout } from "@/lib/types";

export function WorkoutCard({
  personId,
  workout,
}: {
  personId: PersonId;
  workout: Workout;
}) {
  const { done, total } = completedSetCount(workout);
  const live = !workout.finishedAt;

  return (
    <Link
      href={`/${personId}/workout/${workout.id}`}
      className="block rounded-3xl border border-line bg-paper p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">
            {formatDateLabel(workout.startedAt)} · {formatTimeLabel(workout.startedAt)}
          </p>
          <h3 className="font-display mt-1 text-2xl leading-tight">{workout.title}</h3>
        </div>
        {live ? (
          <span className="accent-soft accent-text rounded-full px-2.5 py-1 text-xs font-semibold">
            Live
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-muted">
        <span>
          {workout.exercises.length} exercise{workout.exercises.length === 1 ? "" : "s"}
        </span>
        <span>
          {done}/{total} sets · {formatDuration(workout.startedAt, workout.finishedAt)}
        </span>
      </div>
    </Link>
  );
}
