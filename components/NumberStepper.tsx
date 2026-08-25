"use client";

export function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  suffix,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  step?: number;
  min?: number;
  suffix?: string;
}) {
  const numeric = value ?? 0;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full bg-line/80 text-lg leading-none"
        onClick={() => onChange(Math.max(min, Number((numeric - step).toFixed(1))))}
        aria-label="Decrease"
      >
        −
      </button>
      <input
        inputMode="decimal"
        className="h-9 w-16 rounded-xl border border-line bg-paper text-center tabular-nums"
        value={value ?? ""}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === "" ? null : Number(next));
        }}
      />
      {suffix ? <span className="w-6 text-xs text-muted">{suffix}</span> : null}
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full bg-line/80 text-lg leading-none"
        onClick={() => onChange(Number((numeric + step).toFixed(1)))}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
