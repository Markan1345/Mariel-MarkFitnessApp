import type { ReactNode, SVGProps } from "react";

export type AppIconName =
  | "activity"
  | "calendar"
  | "chevron-right"
  | "dumbbell"
  | "grip"
  | "history"
  | "home"
  | "plus"
  | "scale"
  | "spark"
  | "moon"
  | "timer"
  | "trend";

const paths: Record<AppIconName, ReactNode> = {
  activity: <path d="M3 12h4l2.2-6 4 12 2.3-6H21" />,
  grip: (
    <>
      <circle cx="9" cy="7" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="9" cy="17" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17" r="1.35" fill="currentColor" stroke="none" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  dumbbell: (
    <>
      <path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" />
      <path d="M3 12H1M23 12h-2" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  scale: (
    <>
      <path d="M5 5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3l2 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M9 7a3 3 0 0 1 6 0M12 7l2-2" />
    </>
  ),
  spark: (
    <>
      <path d="m12 2 1.4 5.1L18 9l-4.6 1.9L12 16l-1.4-5.1L6 9l4.6-1.9Z" />
      <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z" />,
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2M9 2h6M12 2v3" />
    </>
  ),
  trend: <path d="m3 17 6-6 4 4 8-9M16 6h5v5" />,
};

export function AppIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: AppIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
