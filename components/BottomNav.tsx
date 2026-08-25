"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PersonId } from "@/lib/types";
import { PEOPLE } from "@/lib/people";

export function BottomNav({ personId }: { personId: PersonId }) {
  const pathname = usePathname();
  const otherId = personId === "mark" ? "mariel" : "mark";
  const homeActive = pathname === `/${personId}`;
  const historyActive = pathname.startsWith(`/${personId}/history`);

  return (
    <nav className="sticky bottom-0 z-20 border-t border-line bg-paper/95 px-2 py-3 backdrop-blur">
      <div className="grid grid-cols-3 items-center">
        <Link
          href={`/${personId}`}
          className={`text-center text-sm font-medium ${homeActive ? "accent-text" : "text-muted"}`}
        >
          Home
        </Link>
        <Link
          href={`/${personId}/history`}
          className={`text-center text-sm font-medium ${historyActive ? "accent-text" : "text-muted"}`}
        >
          History
        </Link>
        <Link href={`/${otherId}`} className="text-center text-sm font-medium text-muted">
          {PEOPLE[otherId].name}
        </Link>
      </div>
    </nav>
  );
}
