import type { WeightEntry } from "@/lib/types";

export function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const width = 360;
  const height = 160;
  const pad = 16;
  if (entries.length === 0) {
    return (
      <div className="grid h-40 place-items-center rounded-3xl border border-dashed border-line text-sm text-muted">
        Log a few weigh-ins to see the trend.
      </div>
    );
  }

  const values = entries.map((entry) => entry.pounds);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const range = Math.max(max - min, 0.5);
  const points = entries.map((entry, index) => {
    const x = pad + (index / Math.max(entries.length - 1, 1)) * (width - pad * 2);
    const y = pad + ((max - entry.pounds) / range) * (height - pad * 2);
    return { x, y, entry };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${path} L ${points.at(-1)!.x} ${height - pad} L ${points[0].x} ${height - pad} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="Body weight trend">
      <path d={area} fill="var(--accent-soft, #dce8e2)" opacity="0.7" />
      <path d={path} fill="none" stroke="var(--accent, #2c5b4e)" strokeWidth="3" strokeLinecap="round" />
      {points.map((point) => (
        <circle key={point.entry.id} cx={point.x} cy={point.y} r="4" fill="var(--accent, #2c5b4e)" />
      ))}
    </svg>
  );
}
