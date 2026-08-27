"use client";

import type { AppState } from "./types";
import { readState, writeState, consumeSkipPush } from "./client-store";
import {
  SYNC_META_KEY,
  applyRemoteToLocal,
  buildEnvelope,
  createDeviceId,
  createSyncRoom,
  fetchRemoteEnvelope,
  formatSyncCode,
  normalizeRemovedIds,
  parseSyncCode,
  parseSyncMeta,
  pushEnvelope,
  type SyncMeta,
  countdownLabel,
} from "./sync";

const CHANGE_EVENT = "mm-fitness-sync-change";
const REMOVED_KEY = "mm-fitness-sync-removed-v1";

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pullTimer: ReturnType<typeof setInterval> | null = null;
let inFlight: Promise<void> | null = null;
let bootstrapped = false;

function emitSyncChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

function readRemovedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REMOVED_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeRemovedIds(ids: string[]) {
  window.localStorage.setItem(REMOVED_KEY, JSON.stringify(normalizeRemovedIds(ids)));
}

export function rememberRemovedIds(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  writeRemovedIds(normalizeRemovedIds(readRemovedIds(), ids));
  scheduleSyncPush();
}

/** @deprecated use rememberRemovedIds */
export function rememberRemovedId(id: string) {
  rememberRemovedIds([id]);
}

export function readSyncMeta(): SyncMeta | null {
  if (typeof window === "undefined") return null;
  return parseSyncMeta(window.localStorage.getItem(SYNC_META_KEY));
}

export function writeSyncMeta(meta: SyncMeta | null) {
  if (typeof window === "undefined") return;
  if (!meta) {
    window.localStorage.removeItem(SYNC_META_KEY);
  } else {
    window.localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  }
  emitSyncChange();
}

function patchMeta(patch: Partial<SyncMeta>) {
  const current = readSyncMeta();
  if (!current) return;
  writeSyncMeta({
    ...current,
    ...patch,
    lastSyncedLabel: countdownLabel(patch.lastSyncedAt ?? current.lastSyncedAt),
  });
}

export function getSyncCode(): string | null {
  const meta = readSyncMeta();
  if (!meta?.passphrase) return null;
  return formatSyncCode(meta.passphrase);
}

export function isSyncLinked(): boolean {
  const meta = readSyncMeta();
  return Boolean(meta?.passphrase);
}

export function subscribeToSyncMeta(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

async function runExclusive(task: () => Promise<void>) {
  if (inFlight) {
    await inFlight;
  }
  inFlight = task().finally(() => {
    inFlight = null;
  });
  await inFlight;
}

export async function createHouseholdSync(): Promise<string> {
  const deviceId = readSyncMeta()?.deviceId ?? createDeviceId();
  const state = readState();
  writeSyncMeta({
    binId: "",
    passphrase: "",
    deviceId,
    lastSyncedAt: null,
    lastStatus: "syncing",
    lastError: null,
    lastSyncedLabel: null,
  });
  try {
    const { meta, code } = await createSyncRoom(state, deviceId);
    writeRemovedIds([]);
    writeSyncMeta({
      ...meta,
      lastStatus: "synced",
      lastError: null,
      lastSyncedLabel: countdownLabel(meta.lastSyncedAt),
    });
    ensureSyncRuntime();
    return code;
  } catch (error) {
    writeSyncMeta({
      binId: "",
      passphrase: "",
      deviceId,
      lastSyncedAt: null,
      lastStatus: "error",
      lastError: error instanceof Error ? error.message : "Could not start sync",
      lastSyncedLabel: null,
    });
    throw error;
  }
}

export async function joinHouseholdSync(code: string): Promise<void> {
  const parsed = parseSyncCode(code);
  if (!parsed) {
    throw new Error("Use a code like LT1-K7M2P9QXH4W8N3YT");
  }
  const deviceId = readSyncMeta()?.deviceId ?? createDeviceId();
  writeSyncMeta({
    binId: "",
    passphrase: parsed.passphrase,
    deviceId,
    lastSyncedAt: null,
    lastStatus: "syncing",
    lastError: null,
    lastSyncedLabel: null,
  });

  try {
    const remote = await fetchRemoteEnvelope(parsed.passphrase);
    if (!remote) throw new Error("No sync room found for that code");
    const local = readState();
    const preferRemote =
      local.workouts.length + local.plans.length + local.weights.length + (local.stepLogs?.length ?? 0) ===
      0;
    const merged = applyRemoteToLocal({
      local,
      remote,
      localRemovedIds: readRemovedIds(),
      preferRemote,
    });
    writeRemovedIds(merged.removedIds);
    writeState(merged.state, { fromSync: true });
    const envelope = buildEnvelope({
      state: merged.state,
      deviceId,
      removedIds: merged.removedIds,
    });
    const binId = await pushEnvelope(parsed.passphrase, envelope);
    writeSyncMeta({
      binId,
      passphrase: parsed.passphrase,
      deviceId,
      lastSyncedAt: envelope.updatedAt,
      lastStatus: "synced",
      lastError: null,
      lastSyncedLabel: countdownLabel(envelope.updatedAt),
    });
    ensureSyncRuntime();
  } catch (error) {
    patchMeta({
      lastStatus: "error",
      lastError: error instanceof Error ? error.message : "Could not join sync",
    });
    throw error;
  }
}

export function unlinkHouseholdSync() {
  writeSyncMeta(null);
  writeRemovedIds([]);
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
}

export async function syncNow(options?: { preferRemote?: boolean }): Promise<AppState> {
  const meta = readSyncMeta();
  if (!meta?.passphrase) {
    throw new Error("Sync is not linked on this device");
  }

  let nextState = readState();
  await runExclusive(async () => {
    patchMeta({ lastStatus: "syncing", lastError: null });
    try {
      const remote = await fetchRemoteEnvelope(meta.passphrase);
      const local = readState();
      let removedIds = readRemovedIds();
      let preferRemote = options?.preferRemote ?? false;

      if (remote) {
        const remoteIsNewer =
          !meta.lastSyncedAt || remote.updatedAt > meta.lastSyncedAt;
        preferRemote = options?.preferRemote ?? remoteIsNewer;
        const merged = applyRemoteToLocal({
          local,
          remote,
          localRemovedIds: removedIds,
          preferRemote,
        });
        nextState = merged.state;
        removedIds = merged.removedIds;
        writeRemovedIds(removedIds);
        writeState(nextState, { fromSync: true });
      }

      const envelope = buildEnvelope({
        state: nextState,
        deviceId: meta.deviceId,
        removedIds,
      });
      const binId = await pushEnvelope(meta.passphrase, envelope);
      writeSyncMeta({
        ...meta,
        binId,
        lastSyncedAt: envelope.updatedAt,
        lastStatus: "synced",
        lastError: null,
        lastSyncedLabel: countdownLabel(envelope.updatedAt),
      });
    } catch (error) {
      patchMeta({
        lastStatus: "error",
        lastError: error instanceof Error ? error.message : "Sync failed",
      });
      throw error;
    }
  });
  return nextState;
}

export function scheduleSyncPush() {
  if (!isSyncLinked()) return;
  if (consumeSkipPush()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void syncNow({ preferRemote: false }).catch(() => {
      /* surfaced via sync meta */
    });
  }, 900);
}

function onVisibilityPull() {
  if (document.visibilityState === "visible" && isSyncLinked()) {
    void syncNow().catch(() => {
      /* surfaced via sync meta */
    });
  }
}

export function ensureSyncRuntime() {
  if (typeof window === "undefined" || bootstrapped) return;
  bootstrapped = true;

  document.addEventListener("visibilitychange", onVisibilityPull);
  window.addEventListener("focus", onVisibilityPull);

  if (pullTimer) clearInterval(pullTimer);
  pullTimer = setInterval(() => {
    if (isSyncLinked() && document.visibilityState === "visible") {
      void syncNow().catch(() => {
        /* surfaced via sync meta */
      });
    }
  }, 20_000);

  if (isSyncLinked()) {
    void syncNow().catch(() => {
      /* surfaced via sync meta */
    });
  }
}
