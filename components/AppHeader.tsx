"use client";

import Link from "next/link";
import type { PersonId } from "@/lib/types";
import { PEOPLE } from "@/lib/people";

export function AppHeader({
  personId,
  title,
  backHref,
}: {
  personId: PersonId;
  title: string;
  backHref?: string;
}) {
  const person = PEOPLE[personId];

  return (
    <header className="flex items-center justify-between gap-3 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
      {backHref ? (
        <Link href={backHref} className="rounded-xl bg-paper px-3 py-2 text-sm font-extrabold text-muted shadow-sm">
          ← Back
        </Link>
      ) : (
        <Link href="/" className="rounded-xl bg-paper px-3 py-2 text-sm font-extrabold text-muted shadow-sm">
          ← Home
        </Link>
      )}
      <div className="text-center">
        <p className="eyebrow">{person.name}</p>
        <h1 className="font-display text-xl leading-none">{title}</h1>
      </div>
      <span className="accent-bg grid h-10 w-10 place-items-center rounded-2xl text-[10px] font-extrabold tracking-wide text-paper shadow-sm">
        {person.short}
      </span>
    </header>
  );
}
