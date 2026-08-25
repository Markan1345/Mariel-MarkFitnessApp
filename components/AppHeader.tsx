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
    <header className="flex items-center justify-between gap-3 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-3">
      {backHref ? (
        <Link href={backHref} className="text-sm font-medium text-muted">
          Back
        </Link>
      ) : (
        <Link href="/" className="text-sm font-medium text-muted">
          Together
        </Link>
      )}
      <div className="text-center">
        <p className="text-[11px] tracking-[0.2em] text-muted uppercase">{person.name}</p>
        <h1 className="font-display text-xl leading-none">{title}</h1>
      </div>
      <span className="accent-bg grid h-8 w-8 place-items-center rounded-full text-[10px] font-semibold tracking-wide text-paper">
        {person.short}
      </span>
    </header>
  );
}
