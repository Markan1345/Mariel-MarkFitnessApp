import { formatSteps } from "@/lib/store";
import { todayKey } from "@/lib/weight";
import type { StepDayTotal } from "@/lib/steps";

export function StepBars({
  days,
  label = "weekday",
  barMax = 36,
}: {
  days: StepDayTotal[];
  label?: "weekday" | "day";
  barMax?: number;
}) {
  const max = Math.max(1, ...days.map((day) => day.total));
  const today = todayKey();

  return (
    <div className={`flex items-end ${label === "day" ? "gap-0.5" : "gap-1"}`}>
      {days.map((day) => {
        const height = 8 + Math.round((day.total / max) * barMax);
        const text =
          label === "day"
            ? String(Number(day.date.slice(8)))
            : new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, {
                weekday: "narrow",
              });
        return (
          <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              className={`w-full rounded-full ${
                day.date === today ? "bg-ink" : day.total > 0 ? "accent-bg" : "bg-line"
              } ${label === "day" ? "max-w-2" : "max-w-6"}`}
              style={{ height }}
              title={`${day.date}: ${formatSteps(day.total)}`}
            />
            <span className={`font-bold text-muted ${label === "day" ? "text-[8px]" : "text-[9px]"}`}>
              {text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
