import type { AppState, CustomPlan, DailyStepLog, WeightEntry, Workout } from "./types";
import { emptyState, isAppState, parseState } from "./store";
import { decryptPayload, encryptPayload } from "./sync-crypto";
import { loadLatestSnapshot, publishSnapshot } from "./sync-cloud";

export const SYNC_META_KEY = "mm-fitness-sync-v1";
export const SYNC_CODE_PREFIX = "LT1";

export type SyncEnvelope = {
  v: 1;
  updatedAt: string;
  deviceId: string;
  state: AppState;
  /** Entity ids removed since the previous sync (tombstones). */
  removedIds: string[];
};

export type SyncMeta = {
  /** Last published snapshot id (debug / UI only). */
  binId: string;
  passphrase: string;
  deviceId: string;
  /** Last envelope updatedAt we successfully applied or pushed. */
  lastSyncedAt: string | null;
  lastStatus: "idle" | "syncing" | "synced" | "error";
  lastError: string | null;
  lastSyncedLabel: string | null;
};

const PASS_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createDeviceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createPassphrase(length = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => PASS_ALPHABET[byte % PASS_ALPHABET.length]).join("");
}

export function formatSyncCode(passphrase: string): string {
  return `${SYNC_CODE_PREFIX}-${passphrase}`.toUpperCase();
}

export function parseSyncCode(raw: string): { passphrase: string } | null {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, "");
  // Current format: LT1-XXXXXXXXXXXXXXXX
  const modern = cleaned.match(/^LT1-([A-Z0-9]{12,32})$/);
  if (modern) return { passphrase: modern[1] };
  // Legacy format from earlier draft: LT1-{binId}-{passphrase}
  const legacy = cleaned.match(/^LT1-[A-Z0-9]+-([A-Z0-9]{12,32})$/);
  if (legacy) return { passphrase: legacy[1] };
  return null;
}

export function isSyncEnvelope(value: unknown): value is SyncEnvelope {
  if (!value || typeof value !== "object") return false;
  const candidate = value as SyncEnvelope;
  return (
    candidate.v === 1 &&
    typeof candidate.updatedAt === "string" &&
    typeof candidate.deviceId === "string" &&
    Array.isArray(candidate.removedIds) &&
    isAppState(candidate.state)
  );
}

function workoutExerciseStamp(exercise: Workout["exercises"][number]): string {
  const sets = (exercise.sets ?? [])
    .map((set) => `${set.id}:${set.weight ?? ""}:${set.reps ?? ""}:${set.completed ? 1 : 0}`)
    .join(",");
  const cardio = exercise.cardio
    ? `${exercise.cardio.minutes ?? ""}:${exercise.cardio.distanceMiles ?? ""}:${exercise.cardio.steps ?? ""}:${exercise.cardio.intensity}`
    : "";
  return `${exercise.id}|${exercise.name}|${exercise.kind ?? ""}|${exercise.notes}|${sets}|${cardio}`;
}

function entityStamp(item: Workout | CustomPlan | WeightEntry | DailyStepLog): string {
  if ("startedAt" in item) {
    const exercises = (item.exercises ?? []).map(workoutExerciseStamp).join(";");
    return `${item.finishedAt ?? ""}|${item.startedAt}|${item.title}|${item.notes}|${exercises}|${item.updatedAt ?? ""}`;
  }
  if ("weekday" in item) {
    const exercises = (item.exercises ?? [])
      .map((exercise) => `${exercise.name}:${exercise.kind}`)
      .join(",");
    return `${item.createdAt}|${item.updatedAt ?? ""}|${item.title}|${item.weekday}|${item.weekStart ?? ""}|${exercises}|${item.kind ?? ""}|${item.mirrorFrom ?? ""}`;
  }
  if ("pounds" in item) {
    return `${item.date}|${item.pounds}|${item.updatedAt ?? ""}`;
  }
  const entriesStamp = item.entries
    .map((entry) => `${entry.id}|${entry.steps}|${entry.label ?? ""}|${entry.updatedAt}`)
    .join(";");
  return `${item.date}|${entriesStamp}|${item.updatedAt}`;
}

function entityUpdatedAt(item: Workout | CustomPlan | WeightEntry | DailyStepLog): string {
  if ("updatedAt" in item && typeof item.updatedAt === "string" && item.updatedAt) {
    return item.updatedAt;
  }
  if ("startedAt" in item) {
    return item.finishedAt ?? item.startedAt;
  }
  if ("weekday" in item) {
    return item.createdAt;
  }
  if ("pounds" in item) {
    return `${item.date}T12:00:00.000Z`;
  }
  return item.updatedAt;
}

/** Prefer the workout that actually has logged lifts/cardio when timestamps tie. */
function workoutRichness(workout: Workout): number {
  return workout.exercises.reduce((sum, exercise) => {
    if ((exercise.kind ?? "strength") === "cardio") {
      const cardio = exercise.cardio;
      return (
        sum +
        (cardio?.minutes ?? 0) +
        (cardio?.distanceMiles ?? 0) * 10 +
        (cardio?.steps ?? 0) / 100
      );
    }
    return (
      sum +
      exercise.sets.reduce((setSum, set) => {
        const logged = set.completed || (set.weight ?? 0) > 0 || (set.reps ?? 0) > 0;
        return setSum + (logged ? 10 : 0) + (set.weight ?? 0) + (set.reps ?? 0);
      }, 0)
    );
  }, 0);
}

function pickPreferred<T extends { id: string }>(
  local: T | undefined,
  remote: T | undefined,
  preferRemote: boolean,
  stamp: (item: T) => string,
): T | undefined {
  if (!local) return remote;
  if (!remote) return local;
  if (stamp(local) === stamp(remote)) return preferRemote ? remote : local;

  const localAt = entityUpdatedAt(local as Workout | CustomPlan | WeightEntry | DailyStepLog);
  const remoteAt = entityUpdatedAt(remote as Workout | CustomPlan | WeightEntry | DailyStepLog);
  if (localAt !== remoteAt) {
    return localAt > remoteAt ? local : remote;
  }

  if ("startedAt" in local && "startedAt" in remote) {
    const localRich = workoutRichness(local as Workout);
    const remoteRich = workoutRichness(remote as Workout);
    if (localRich !== remoteRich) {
      return localRich > remoteRich ? local : remote;
    }
  }

  return preferRemote ? remote : local;
}

function mergeCollection<T extends { id: string }>(
  local: T[],
  remote: T[],
  removed: Set<string>,
  preferRemote: boolean,
  stamp: (item: T) => string,
): T[] {
  const ids = new Set<string>();
  const localMap = new Map(local.map((item) => [item.id, item]));
  const remoteMap = new Map(remote.map((item) => [item.id, item]));
  for (const id of localMap.keys()) ids.add(id);
  for (const id of remoteMap.keys()) ids.add(id);

  const merged: T[] = [];
  for (const id of ids) {
    if (removed.has(id)) continue;
    const next = pickPreferred(localMap.get(id), remoteMap.get(id), preferRemote, stamp);
    if (next) merged.push(next);
  }
  return merged;
}

/** Merge two app states. Prefer remote on conflicts when preferRemote is true. */
export function mergeAppStates(
  local: AppState,
  remote: AppState,
  removedIds: string[],
  preferRemote: boolean,
): AppState {
  const removed = new Set(removedIds);
  return {
    version: 2,
    workouts: mergeCollection(
      local.workouts,
      remote.workouts,
      removed,
      preferRemote,
      entityStamp,
    ),
    plans: mergeCollection(local.plans, remote.plans, removed, preferRemote, entityStamp),
    weights: mergeCollection(local.weights, remote.weights, removed, preferRemote, entityStamp),
    stepLogs: mergeCollection(
      local.stepLogs ?? [],
      remote.stepLogs ?? [],
      removed,
      preferRemote,
      entityStamp,
    ),
  };
}

export function normalizeRemovedIds(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const id of list) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length >= 400) return out;
    }
  }
  return out;
}

export function buildEnvelope(input: {
  state: AppState;
  deviceId: string;
  removedIds?: string[];
  updatedAt?: string;
}): SyncEnvelope {
  return {
    v: 1,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    deviceId: input.deviceId,
    state: {
      version: 2,
      workouts: input.state.workouts,
      plans: input.state.plans ?? [],
      weights: input.state.weights ?? [],
      stepLogs: input.state.stepLogs ?? [],
    },
    removedIds: normalizeRemovedIds(input.removedIds ?? []),
  };
}

export async function packEnvelope(passphrase: string, envelope: SyncEnvelope): Promise<string> {
  return encryptPayload(passphrase, envelope);
}

export async function unpackEnvelope(
  passphrase: string,
  payload: string,
): Promise<SyncEnvelope> {
  const parsed = await decryptPayload<unknown>(passphrase, payload);
  if (!isSyncEnvelope(parsed)) {
    throw new Error("Sync data looks corrupted");
  }
  return {
    ...parsed,
    state: parseState(JSON.stringify(parsed.state)),
    removedIds: normalizeRemovedIds(parsed.removedIds),
  };
}

export async function createSyncRoom(state: AppState, deviceId: string): Promise<{
  meta: Omit<SyncMeta, "lastStatus" | "lastError" | "lastSyncedLabel">;
  code: string;
  envelope: SyncEnvelope;
}> {
  const passphrase = createPassphrase();
  const envelope = buildEnvelope({ state, deviceId, removedIds: [] });
  const payload = await packEnvelope(passphrase, envelope);
  const binId = await publishSnapshot(passphrase, {
    app: "lifting-together",
    payload,
  });
  return {
    meta: {
      binId,
      passphrase,
      deviceId,
      lastSyncedAt: envelope.updatedAt,
    },
    code: formatSyncCode(passphrase),
    envelope,
  };
}

export async function fetchRemoteEnvelope(passphrase: string): Promise<SyncEnvelope | null> {
  const latest = await loadLatestSnapshot(passphrase);
  if (!latest) return null;
  return unpackEnvelope(passphrase, latest.body.payload);
}

export async function pushEnvelope(
  passphrase: string,
  envelope: SyncEnvelope,
): Promise<string> {
  const payload = await packEnvelope(passphrase, envelope);
  return publishSnapshot(passphrase, {
    app: "lifting-together",
    payload,
  });
}

export function emptySyncMeta(deviceId = createDeviceId()): SyncMeta {
  return {
    binId: "",
    passphrase: "",
    deviceId,
    lastSyncedAt: null,
    lastStatus: "idle",
    lastError: null,
    lastSyncedLabel: null,
  };
}

export function parseSyncMeta(raw: string | null): SyncMeta | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SyncMeta>;
    if (!parsed.passphrase || !parsed.deviceId) return null;
    return {
      binId: parsed.binId ?? "",
      passphrase: parsed.passphrase,
      deviceId: parsed.deviceId,
      lastSyncedAt: parsed.lastSyncedAt ?? null,
      lastStatus: parsed.lastStatus ?? "idle",
      lastError: parsed.lastError ?? null,
      lastSyncedLabel: parsed.lastSyncedLabel ?? null,
    };
  } catch {
    return null;
  }
}

export function applyRemoteToLocal(input: {
  local: AppState;
  remote: SyncEnvelope;
  localRemovedIds: string[];
  preferRemote: boolean;
}): { state: AppState; removedIds: string[] } {
  const removedIds = normalizeRemovedIds(input.localRemovedIds, input.remote.removedIds);
  return {
    state: mergeAppStates(input.local, input.remote.state, removedIds, input.preferRemote),
    removedIds,
  };
}

export function exportStateJson(state: AppState): string {
  return `${JSON.stringify(state, null, 2)}\n`;
}

export function importStateJson(raw: string): AppState {
  const parsed: unknown = JSON.parse(raw);
  if (!isAppState(parsed)) {
    throw new Error("File is not a Lifting Together backup");
  }
  return parseState(JSON.stringify(parsed));
}

export function countdownLabel(iso: string | null, now = Date.now()): string | null {
  if (!iso) return null;
  const delta = Math.max(0, now - Date.parse(iso));
  if (!Number.isFinite(delta)) return null;
  if (delta < 15_000) return "Just now";
  if (delta < 60_000) return `${Math.floor(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h ago`;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function blankState(): AppState {
  return emptyState();
}
