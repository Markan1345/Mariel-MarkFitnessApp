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
  const items = [
    { href: "/", label: "Together", match: pathname === "/" },
    { href: "/plans", label: "Plans", match: pathname.startsWith("/plans") },
    { href: "/weight", label: "Weight", match: pathname.startsWith("/weight") },
    {
      href: "/session",
      label: live ? "Session" : "Lift",
      match: pathname.startsWith("/session"),
    },
  ];

  return (
    <nav className="sticky bottom-0 z-20 border-t border-line bg-paper/95 px-1 py-3 backdrop-blur">
      <div className="grid grid-cols-4 items-center">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-center text-sm font-medium ${item.match ? "text-ink" : "text-muted"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
