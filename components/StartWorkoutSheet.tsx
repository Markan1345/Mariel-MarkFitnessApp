"use client";

import { WORKOUT_TEMPLATES } from "@/lib/exercises";
import { planForDate, plansForPerson } from "@/lib/programs";
import type { StartChoice } from "@/lib/start";
import type { CustomPlan, PersonId, Workout } from "@/lib/types";
import { WEEKDAYS } from "@/lib/weekdays";
import { WorkoutProgression } from "./WorkoutProgression";

export function StartWorkoutSheet({
  open,
  onClose,
  personId,
  last,
  plans,
  workouts,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  personId: PersonId;
  last?: Workout;
  plans: CustomPlan[];
  workouts: Workout[];
  onStart: (choice: StartChoice) => void;
}) {
  if (!open) return null;
  const now = new Date();
  const todayPlan = planForDate(plans, personId, now);
  const extras = plansForPerson(plans, personId)
    .filter((plan) => plan.id !== todayPlan?.id)
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/55 p-3 backdrop-blur-sm sm:items-center">
      <div className="surface-card flex max-h-[90svh] w-full max-w-[430px] flex-col p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Choose your workout</p>
            <h2 className="font-display text-3xl">New session</h2>
          </div>
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
          . Use today&apos;s custom plan, cardio, or a lifting template.
        </p>
        <div className="mt-4 overflow-y-auto">
          {todayPlan ? (
            <>
              <button
                type="button"
                onClick={() => onStart({ type: "plan", plan: todayPlan })}
                className="accent-action w-full py-3"
              >
                Start today · {todayPlan.title}
              </button>
              <WorkoutProgression
                workouts={workouts}
                personId={personId}
                exercises={todayPlan.exercises}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => onStart({ type: "empty" })}
              className="accent-action w-full py-3"
            >
              Start empty workout
            </button>
          )}
          {todayPlan ? (
            <button
              type="button"
              onClick={() => onStart({ type: "empty" })}
              className="mt-2 w-full rounded-2xl border border-line bg-bg py-3 font-medium"
            >
              Start empty workout
            </button>
          ) : null}
          {last ? (
            <>
              <button
                type="button"
                onClick={() => onStart({ type: "repeat", workout: last })}
                className="mt-2 w-full rounded-2xl border border-line bg-bg py-3 font-medium"
              >
                Repeat {last.title}
              </button>
              {!todayPlan ? (
                <WorkoutProgression
                  workouts={workouts}
                  personId={personId}
                  exercises={last.exercises.map((exercise) => ({
                    name: exercise.name,
                    kind: exercise.kind ?? "strength",
                  }))}
                />
              ) : null}
            </>
          ) : null}

          {extras.length > 0 ? (
            <>
              <p className="mt-5 text-xs tracking-[0.18em] text-muted uppercase">Custom days</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {extras.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => onStart({ type: "plan", plan })}
                    className="surface-card px-3 py-3 text-left"
                  >
                    <span className="font-medium">{plan.title}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {plan.weekday !== null ? WEEKDAYS[plan.weekday].short : "Custom"} · {plan.exercises.length} moves
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <p className="mt-5 text-xs tracking-[0.18em] text-muted uppercase">Templates</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {WORKOUT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onStart({ type: "template", template })}
                className="surface-card px-3 py-3 text-left"
              >
                <span className="font-medium">{template.title}</span>
                <span className="mt-1 block text-xs text-muted">{template.exercises.length} exercises</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
