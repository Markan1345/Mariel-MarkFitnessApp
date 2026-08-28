"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon, type AppIconName } from "@/components/AppIcon";
import { activeWorkoutForPerson } from "@/lib/store";
import { useFitnessStore } from "@/lib/use-fitness-store";

export function AppNav() {
  const pathname = usePathname();
  const { state } = useFitnessStore();
  const live = Boolean(
    activeWorkoutForPerson(state, "mark") || activeWorkoutForPerson(state, "mariel"),
  );
  const path = pathname.replace(/\/$/, "") || "/";
  const items: { href: string; label: string; icon: AppIconName; match: boolean }[] = [
    { href: "/", label: "Home", icon: "home", match: path === "/" },
    { href: "/plans", label: "Plan", icon: "calendar", match: path.startsWith("/plans") },
    { href: "/steps", label: "Steps", icon: "steps", match: path.startsWith("/steps") },
    { href: "/weight", label: "Weight", icon: "scale", match: path.startsWith("/weight") },
    {
      href: "/session",
      label: live ? "Session" : "Lift",
      icon: "dumbbell",
      match: path.startsWith("/session"),
    },
  ];

  return (
    <nav className="sticky bottom-0 z-20 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-5 items-center rounded-[1.4rem] border border-line/80 bg-paper/95 p-1.5 shadow-[0_-8px_30px_rgba(78,47,21,0.1)] backdrop-blur">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-center text-[10px] font-bold transition ${
              item.match ? "bg-ink text-paper shadow-md" : "text-muted"
            }`}
          >
            <AppIcon name={item.icon} className="h-5 w-5" />
            {item.label}
            {item.href === "/session" && live ? (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sun ring-2 ring-ink" />
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
