"use client";

import Link from "next/link";
import { PEOPLE, PERSON_IDS } from "@/lib/people";

export default function HomePage() {
  return (
    <main className="flex min-h-svh flex-col px-6 pb-10 pt-12">
      <p className="text-sm tracking-[0.22em] text-muted uppercase">Together</p>
      <h1 className="font-display mt-3 max-w-[14ch] text-5xl leading-[0.95] tracking-tight">
        Mark &amp; Mariel
      </h1>
      <p className="mt-4 max-w-[32ch] text-base leading-relaxed text-muted">
        A quiet place to log your sessions. Pick who is training, then start lifting.
      </p>

      <div className="mt-10 grid gap-3">
        {PERSON_IDS.map((id) => {
          const person = PEOPLE[id];
          return (
            <Link
              key={id}
              href={`/${id}`}
              className={`person-${id} group rounded-3xl border border-line bg-paper p-5 transition hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.18em] text-muted uppercase">Train as</p>
                  <h2 className="font-display mt-1 text-3xl">{person.name}</h2>
                  <p className="mt-1 text-sm text-muted">{person.blurb}</p>
                </div>
                <span className="accent-bg grid h-12 w-12 place-items-center rounded-full text-lg font-semibold text-paper">
                  {person.short}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
