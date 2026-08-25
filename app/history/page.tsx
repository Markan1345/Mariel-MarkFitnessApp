"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { WorkoutCard } from "@/components/WorkoutCard";
import { PERSON_IDS, PEOPLE } from "@/lib/people";
import { groupWorkoutsByDay } from "@/lib/stats";
import { useFitnessStore } from "@/lib/use-fitness-store";
import { bodyWeightPounds } from "@/lib/weight";
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
      <header className="px-5 pt-8 pb-3">
        <p className="text-sm tracking-[0.22em] text-muted uppercase">Together</p>
        <h1 className="font-display mt-2 text-4xl leading-none">History</h1>
      </header>
      <main className="flex-1 px-5 pb-8">
        <div className="grid grid-cols-3 gap-1 rounded-full bg-line/70 p-1">
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
          <div className="mt-6 rounded-3xl border border-dashed border-line px-4 py-10 text-center">
            <p className="font-display text-3xl">Still a blank page</p>
            <p className="mt-2 text-sm text-muted">
              Finished workouts for both of you will collect here, day by day.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6">
            {days.map((day) => (
              <section key={day.key} className="grid gap-2">
                <p className="text-xs tracking-[0.16em] text-muted uppercase" suppressHydrationWarning>
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
                        ? `/${workout.personId}/workout/${workout.id}`
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
      className={`rounded-full py-2 text-sm font-medium ${selected ? "bg-paper text-ink" : "text-muted"}`}
    >
      {children}
    </button>
  );
}
