import type { LastLift } from "@/lib/progression";

export function LiftChart({
  points,
  label = "Lift weight trend",
}: {
  points: LastLift[];
  label?: string;
}) {
  const width = 360;
  const height = 160;
  const pad = 16;
  if (points.length === 0) {
    return (
      <div className="grid h-40 place-items-center rounded-3xl border border-dashed border-line text-sm text-muted">
        Finish a few sets to see the trend.
      </div>
    );
  }

  const values = points.map((point) => point.weight);
  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  const range = Math.max(max - min, 5);
  const plotted = points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2);
    const y = pad + ((max - point.weight) / range) * (height - pad * 2);
    return { x, y, point };
  });
  const path = plotted.map((item, index) => `${index === 0 ? "M" : "L"} ${item.x} ${item.y}`).join(" ");
  const area =
    points.length === 1
      ? ""
      : `${path} L ${plotted.at(-1)!.x} ${height - pad} L ${plotted[0].x} ${height - pad} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label={label}>
      {area ? <path d={area} fill="var(--accent-soft, #dce8e2)" opacity="0.7" /> : null}
      {points.length > 1 ? (
        <path d={path} fill="none" stroke="var(--accent, #2c5b4e)" strokeWidth="3" strokeLinecap="round" />
      ) : null}
      {plotted.map((item) => (
        <circle
          key={`${item.point.workoutId}-${item.point.exerciseName}`}
          cx={item.x}
          cy={item.y}
          r={points.length === 1 ? 6 : 4}
          fill="var(--accent, #2c5b4e)"
        />
      ))}
    </svg>
  );
}
