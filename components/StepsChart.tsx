import type { StepDayTotal } from "@/lib/steps";

export function StepsChart({ days }: { days: StepDayTotal[] }) {
  const width = 360;
  const height = 160;
  const pad = 16;
  const points = days.filter((day) => day.total > 0);
  if (points.length === 0) {
    return (
      <div className="grid h-40 place-items-center rounded-3xl border border-dashed border-line text-sm text-muted">
        Log a few days of steps to see the trend.
      </div>
    );
  }

  const values = points.map((day) => day.total);
  const min = 0;
  const max = Math.max(...values) * 1.08;
  const range = Math.max(max - min, 1);
  const plotted = points.map((day, index) => {
    const x = pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2);
    const y = pad + ((max - day.total) / range) * (height - pad * 2);
    return { x, y, day };
  });
  const path = plotted.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${path} L ${plotted.at(-1)!.x} ${height - pad} L ${plotted[0].x} ${height - pad} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="Daily step trend">
      <path d={area} fill="var(--accent-soft, #dce8e2)" opacity="0.7" />
      <path d={path} fill="none" stroke="var(--accent, #2c5b4e)" strokeWidth="3" strokeLinecap="round" />
      {plotted.map((point) => (
        <circle key={point.day.date} cx={point.x} cy={point.y} r="4" fill="var(--accent, #2c5b4e)" />
      ))}
    </svg>
  );
}
