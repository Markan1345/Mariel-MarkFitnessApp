import type { ReactNode } from "react";

/** Keeps Mark / Mariel controls visible while the page scrolls. */
export function StickyPersonBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-[env(safe-area-inset-top,0px)] z-30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-full h-[env(safe-area-inset-top,0px)] bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] backdrop-blur-md"
      />
      <div className="border-b border-line/70 bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-5 py-3 backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}
