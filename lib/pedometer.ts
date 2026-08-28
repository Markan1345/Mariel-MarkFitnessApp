export type PeakState = {
  lastMag: number;
  lastStepAt: number;
  waitingForValley: boolean;
  usesGravity: boolean;
};

export function emptyPeakState(now = 0, usesGravity = true): PeakState {
  return { lastMag: usesGravity ? 9.8 : 0, lastStepAt: now, waitingForValley: false, usesGravity };
}

export function magnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

/** Peak/valley detector for phone accelerometer samples. */
export function stepFromMagnitude(
  state: PeakState,
  mag: number,
  now: number,
): { stepped: boolean; state: PeakState } {
  const peak = state.usesGravity ? 11.15 : 1.75;
  const valley = state.usesGravity ? 9.65 : 0.55;
  const minMs = 280;
  if (!state.waitingForValley && mag >= peak && now - state.lastStepAt >= minMs) {
    return {
      stepped: true,
      state: { ...state, lastMag: mag, lastStepAt: now, waitingForValley: true },
    };
  }
  if (state.waitingForValley && mag <= valley) {
    return { stepped: false, state: { ...state, lastMag: mag, waitingForValley: false } };
  }
  return { stepped: false, state: { ...state, lastMag: mag } };
}

export function motionIsSupported(): boolean {
  return typeof window !== "undefined" && "DeviceMotionEvent" in window;
}

export async function requestMotionPermission(): Promise<"granted" | "denied" | "unsupported"> {
  if (!motionIsSupported()) return "unsupported";
  const Motion = DeviceMotionEvent as unknown as {
    requestPermission?: () => Promise<PermissionState | "granted" | "denied">;
  };
  if (typeof Motion.requestPermission === "function") {
    const result = await Motion.requestPermission();
    return result === "granted" ? "granted" : "denied";
  }
  return "granted";
}

export function startPedometer(onStep: () => void): () => void {
  let state = emptyPeakState(Date.now(), true);
  const handler = (event: DeviceMotionEvent) => {
    const withG = event.accelerationIncludingGravity;
    const acc = withG ?? event.acceleration;
    if (!acc || acc.x == null || acc.y == null || acc.z == null) return;
    const usesGravity = Boolean(withG);
    if (state.usesGravity !== usesGravity) {
      state = emptyPeakState(Date.now(), usesGravity);
    }
    const next = stepFromMagnitude(state, magnitude(acc.x, acc.y, acc.z), Date.now());
    state = next.state;
    if (next.stepped) onStep();
  };
  window.addEventListener("devicemotion", handler);
  return () => window.removeEventListener("devicemotion", handler);
}
