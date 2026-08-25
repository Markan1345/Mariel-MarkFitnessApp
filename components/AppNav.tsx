"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeWorkoutForPerson } from "@/lib/store";
import { useFitnessStore } from "@/lib/use-fitness-store";

export function AppNav() {
  const pathname = usePathname();
  const { state } = useFitnessStore();
  const live = Boolean(
    activeWorkoutForPerson(state, "mark") || activeWorkoutForPerson(state, "mariel"),
  );
  const path = pathname.replace(/\/$/, "") || "/";
  const items = [
    { href: "/", label: "Together", match: path === "/" },
    { href: "/plans", label: "Plans", match: path.startsWith("/plans") },
    { href: "/weight", label: "Weight", match: path.startsWith("/weight") },
    {
      href: "/session",
      label: live ? "Session" : "Lift",
      match: path.startsWith("/session"),
    },
  ];

  return (
    <nav className="sticky bottom-0 z-20 border-t border-line bg-paper/95 px-1 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="grid grid-cols-4 items-center">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`grid min-h-11 place-items-center text-center text-sm font-medium ${item.match ? "text-ink" : "text-muted"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
