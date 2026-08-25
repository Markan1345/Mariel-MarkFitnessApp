"use client";

import { useState } from "react";
import { parseDecimalInput } from "@/lib/numbers";

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
  const [draft, setDraft] = useState<string | null>(null);
  const numeric = value ?? 0;
  const text = draft ?? (value == null ? "" : String(value));

  function emit(raw: string) {
    const parsed = parseDecimalInput(raw);
    setDraft(parsed.text);
    onChange(parsed.value);
  }

  function bump(delta: number) {
    const next = Math.max(min, Number((numeric + delta).toFixed(1)));
    setDraft(null);
    onChange(next);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full bg-line/80 text-lg leading-none"
        onClick={() => bump(-step)}
        aria-label="Decrease"
      >
        −
      </button>
      <input
        inputMode="decimal"
        className="h-9 w-20 rounded-xl border border-line bg-paper text-center tabular-nums"
        value={text}
        onFocus={(event) => {
          setDraft(text);
          event.target.select();
        }}
        onBlur={() => setDraft(null)}
        onChange={(event) => emit(event.target.value)}
      />
      {suffix ? <span className="min-w-6 px-0.5 text-xs text-muted">{suffix}</span> : null}
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full bg-line/80 text-lg leading-none"
        onClick={() => bump(step)}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
