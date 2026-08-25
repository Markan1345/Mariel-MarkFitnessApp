"use client";

import { useMemo, useState } from "react";
import { MUSCLE_GROUPS, searchExercises } from "@/lib/exercises";
import type { MuscleGroup } from "@/lib/types";

export function ExercisePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "all">("all");

  const results = useMemo(() => {
    const matches = searchExercises(query);
    if (group === "all") return matches;
    return matches.filter((exercise) => exercise.group === group);
  }, [query, group]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-3 sm:items-center">
      <div className="flex max-h-[85svh] w-full max-w-[430px] flex-col rounded-3xl bg-paper p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Add exercise</h2>
          <button type="button" onClick={onClose} className="text-sm text-muted">
            Close
          </button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search or type a custom name"
          className="mt-3 h-11 rounded-2xl border border-line bg-bg px-4"
        />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={group === "all"} onClick={() => setGroup("all")}>
            All
          </FilterChip>
          {MUSCLE_GROUPS.map((item) => (
            <FilterChip
              key={item.id}
              active={group === item.id}
              onClick={() => setGroup(item.id)}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>
        <div className="mt-3 overflow-y-auto">
          {query.trim() && !results.some((item) => item.name.toLowerCase() === query.trim().toLowerCase()) ? (
            <button
              type="button"
              className="mb-2 w-full rounded-2xl border border-dashed border-line px-4 py-3 text-left"
              onClick={() => {
                onPick(query.trim());
                setQuery("");
              }}
            >
              Use “{query.trim()}”
            </button>
          ) : null}
          {results.map((exercise) => (
            <button
              key={exercise.name}
              type="button"
              className="flex w-full items-center justify-between border-b border-line/70 px-1 py-3 text-left last:border-b-0"
              onClick={() => {
                onPick(exercise.name);
                setQuery("");
              }}
            >
              <span>{exercise.name}</span>
              <span className="text-xs tracking-wide text-muted uppercase">
                {exercise.group.replace("-", " ")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
        active ? "accent-bg text-paper" : "bg-line/70 text-ink"
      }`}
    >
      {children}
    </button>
  );
}
