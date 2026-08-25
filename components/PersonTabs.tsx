"use client";

import type { PersonId } from "@/lib/types";
import { PEOPLE, PERSON_IDS } from "@/lib/people";

export function PersonTabs({
  active,
  onChange,
  live,
}: {
  active: PersonId;
  onChange: (personId: PersonId) => void;
  live: Partial<Record<PersonId, boolean>>;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-full bg-line/70 p-1">
      {PERSON_IDS.map((id) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`person-${id} rounded-full px-3 py-2 text-sm font-semibold ${
              selected ? "accent-bg text-paper" : "text-ink"
            }`}
          >
            {PEOPLE[id].name}
            {live[id] ? <span className="ml-1 text-[10px] tracking-wide uppercase">Live</span> : null}
          </button>
        );
      })}
    </div>
  );
}
