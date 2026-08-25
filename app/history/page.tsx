"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { AppNav } from "@/components/AppNav";
import { WorkoutCard } from "@/components/WorkoutCard";
import { PERSON_IDS, PEOPLE } from "@/lib/people";
import { groupWorkoutsByDay } from "@/lib/stats";
import { useFitnessStore } from "@/lib/use-fitness-store";
import { bodyWeightPounds } from "@/lib/weight";
import { workoutHref } from "@/lib/routes";
import type { PersonId } from "@/lib/types";

export default function HistoryPage() {
  const { state } = useFitnessStore();
  const [filter, setFilter] = useState<PersonId | "both">("both");
  const workouts =
    filter === "both"
      ? state.workouts
      : state.workouts.filter((workout) => workout.personId === filter);
  const days = groupWorkoutsByDay(workouts);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Training log</p>
            <h1 className="font-display mt-1 text-[2.65rem] leading-none">Workout history</h1>
            <p className="mt-2 text-sm text-muted">Every session adds to the streak.</p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sun text-ink shadow-[0_8px_18px_rgba(231,138,52,0.25)]">
            <AppIcon name="history" className="h-6 w-6" />
          </div>
        </div>
      </header>
      <main className="flex-1 px-5 pb-8">
        <div className="segmented-control grid grid-cols-3 gap-1">
          <FilterChip selected={filter === "both"} onClick={() => setFilter("both")}>
            Both
          </FilterChip>
          {PERSON_IDS.map((id) => (
            <FilterChip key={id} selected={filter === id} onClick={() => setFilter(id)}>
              {PEOPLE[id].name}
            </FilterChip>
          ))}
        </div>
        {days.length === 0 ? (
          <div className="surface-card mt-6 border-dashed px-4 py-10 text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-sun/30 text-gold">
              <AppIcon name="dumbbell" className="h-6 w-6" />
            </span>
            <p className="font-display text-3xl">Still a blank page</p>
            <p className="mt-2 text-sm text-muted">
              Finished workouts for both of you will collect here, day by day.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6">
            {days.map((day) => (
              <section key={day.key} className="grid gap-2">
                <p className="eyebrow" suppressHydrationWarning>
                  {day.date.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                {day.workouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    showPerson={filter === "both"}
                    bodyWeightLb={bodyWeightPounds(state.weights, workout.personId)}
                    href={
                      workout.finishedAt
                        ? workoutHref(workout.personId, workout.id)
                        : `/session?person=${workout.personId}`
                    }
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </main>
      <AppNav />
    </div>
  );
}

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[0.85rem] py-2.5 text-sm font-extrabold ${
        selected ? "bg-ink text-paper shadow-sm" : "text-muted"
      }`}
    >
      {children}
    </button>
  );
}
