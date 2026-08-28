"use client";

import { useEffect, useRef, useState } from "react";
import { AppIcon } from "./AppIcon";
import { formatSteps } from "@/lib/store";
import { motionIsSupported, requestMotionPermission, startPedometer } from "@/lib/pedometer";
import { PEOPLE } from "@/lib/people";
import type { PersonId } from "@/lib/types";

export function PhoneStepTracker({
  personId,
  liveCounterSteps,
  dayPhoneTotal,
  onChange,
}: {
  personId: PersonId;
  liveCounterSteps: number;
  dayPhoneTotal: number;
  onChange: (liveCounterSteps: number) => void;
}) {
  const [status, setStatus] = useState<"idle" | "running" | "denied" | "unsupported">("idle");
  const [live, setLive] = useState(liveCounterSteps);
  const liveRef = useRef(liveCounterSteps);
  const runningRef = useRef(false);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (runningRef.current) return;
    liveRef.current = liveCounterSteps;
    setLive(liveCounterSteps);
  }, [liveCounterSteps]);

  useEffect(() => {
    if (!motionIsSupported()) setStatus("unsupported");
  }, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      stopRef.current?.();
    };
  }, []);

  async function start() {
    if (!motionIsSupported()) {
      setStatus("unsupported");
      return;
    }
    const permission = await requestMotionPermission();
    if (permission !== "granted") {
      setStatus(permission === "unsupported" ? "unsupported" : "denied");
      return;
    }
    runningRef.current = true;
    setStatus("running");
    liveRef.current = liveCounterSteps;
    setLive(liveCounterSteps);
    let wake: { release: () => Promise<void> } | null = null;
    try {
      wake = (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      wake = null;
    }
    let pending = 0;
    const stop = startPedometer(() => {
      if (!runningRef.current) return;
      liveRef.current += 1;
      pending += 1;
      setLive(liveRef.current);
      if (pending >= 5) {
        pending = 0;
        onChange(liveRef.current);
      }
    });
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        onChange(liveRef.current);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      void wake?.release();
      onChange(liveRef.current);
    };
  }

  async function toggle() {
    if (status === "running") {
      stopRef.current?.();
      stopRef.current = null;
      runningRef.current = false;
      setStatus("idle");
      onChange(liveRef.current);
      return;
    }
    const cleanup = await start();
    stopRef.current = cleanup ?? null;
  }

  const hint =
    status === "unsupported"
      ? "Automatic counting needs a phone browser. You can still add step counts below."
      : status === "denied"
        ? "Motion access was blocked. Enable it in Settings, or add counts manually."
        : status === "running"
          ? `Counting for ${PEOPLE[personId].name}. Keep this screen open and the phone on you.`
          : `Counts ${PEOPLE[personId].name}'s steps while this page stays open. Saved as a live counter entry.`;

  return (
    <section className="surface-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Phone pedometer</p>
          <h2 className="font-display text-2xl leading-tight">Track phone steps</h2>
        </div>
        <span className="accent-soft accent-text grid h-10 w-10 place-items-center rounded-2xl">
          <AppIcon name="steps" className="h-5 w-5" />
        </span>
      </div>
      <p className="font-display mt-3 text-4xl leading-none">{live.toLocaleString()}</p>
      <p className="mt-1 text-sm text-muted">
        Live counter · {formatSteps(dayPhoneTotal)} total phone today
      </p>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={status === "unsupported"}
        className={`mt-4 w-full py-3 ${status === "running" ? "rounded-2xl border border-line bg-paper font-extrabold" : "accent-action"}`}
      >
        {status === "running" ? "Stop counting" : "Start counting"}
      </button>
      <p className="mt-3 text-xs leading-relaxed text-muted">{hint}</p>
    </section>
  );
}
