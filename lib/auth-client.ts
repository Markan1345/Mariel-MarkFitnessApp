"use client";

import type { AppState } from "./types";
import {
  AUTH_LOCAL_PROFILES_KEY,
  AUTH_SESSION_KEY,
  buildProfileRecord,
  displayNameFromUsername,
  normalizeUsername,
  parseAuthSession,
  parseLocalProfileHints,
  upsertLocalProfileHint,
  validatePassword,
  validateUsername,
  type AuthSession,
  type LocalProfileHint,
} from "./auth";
import { loadProfileRecord, publishProfile, usernameIsTaken } from "./auth-cloud";
import { readState, writeState } from "./client-store";
import { emptyState } from "./store";
import {
  applyRemoteToLocal,
  buildEnvelope,
  createDeviceId,
  createSyncRoom,
  fetchRemoteEnvelope,
  formatSyncCode,
  pushEnvelope,
} from "./sync";
import {
  ensureSyncRuntime,
  readSyncMeta,
  unlinkHouseholdSync,
  writeRemovedIds,
  writeSyncMeta,
} from "./sync-client";

const CHANGE_EVENT = "mm-fitness-auth-change";

function emitAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  return parseAuthSession(window.localStorage.getItem(AUTH_SESSION_KEY));
}

export function writeAuthSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  } else {
    window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  }
  emitAuthChange();
}

export function isSignedIn(): boolean {
  return Boolean(readAuthSession()?.username);
}

export function readLocalProfileHints(): LocalProfileHint[] {
  if (typeof window === "undefined") return [];
  return parseLocalProfileHints(window.localStorage.getItem(AUTH_LOCAL_PROFILES_KEY));
}

function rememberLocalHint(session: AuthSession) {
  const hints = upsertLocalProfileHint(readLocalProfileHints(), {
    username: session.username,
    displayName: session.displayName,
    lastSignedInAt: session.signedInAt,
  });
  window.localStorage.setItem(AUTH_LOCAL_PROFILES_KEY, JSON.stringify(hints));
}

export function subscribeToAuth(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function countEntities(state: AppState): number {
  return (
    state.workouts.length +
    (state.plans?.length ?? 0) +
    (state.weights?.length ?? 0) +
    (state.stepLogs?.length ?? 0)
  );
}

async function attachSyncPassphrase(passphrase: string, options?: { preferRemote?: boolean }) {
  const deviceId = readSyncMeta()?.deviceId ?? createDeviceId();
  writeSyncMeta({
    binId: "",
    passphrase,
    deviceId,
    lastSyncedAt: null,
    lastStatus: "syncing",
    lastError: null,
    lastSyncedLabel: null,
  });

  const remote = await fetchRemoteEnvelope(passphrase);
  const local = readState();
  const preferRemote =
    options?.preferRemote ?? (countEntities(local) === 0 && Boolean(remote));

  if (remote) {
    const merged = applyRemoteToLocal({
      local,
      remote,
      localRemovedIds: [],
      preferRemote,
    });
    writeRemovedIds(merged.removedIds);
    writeState(merged.state, { fromSync: true });
    const envelope = buildEnvelope({
      state: merged.state,
      deviceId,
      removedIds: merged.removedIds,
    });
    const binId = await pushEnvelope(passphrase, envelope);
    writeSyncMeta({
      binId,
      passphrase,
      deviceId,
      lastSyncedAt: envelope.updatedAt,
      lastStatus: "synced",
      lastError: null,
      lastSyncedLabel: null,
    });
  } else {
    const envelope = buildEnvelope({
      state: local,
      deviceId,
      removedIds: [],
    });
    const binId = await pushEnvelope(passphrase, envelope);
    writeRemovedIds([]);
    writeSyncMeta({
      binId,
      passphrase,
      deviceId,
      lastSyncedAt: envelope.updatedAt,
      lastStatus: "synced",
      lastError: null,
      lastSyncedLabel: null,
    });
  }

  ensureSyncRuntime();
}

/**
 * Create a profile from the data currently on this device.
 * Existing workouts/plans/weights/steps become this profile's cloud-backed data.
 */
export async function createAccount(input: {
  username: string;
  password: string;
  displayName?: string;
}): Promise<AuthSession> {
  const username = validateUsername(input.username);
  const password = validatePassword(input.password);
  const displayName =
    input.displayName?.trim() || displayNameFromUsername(username);

  if (await usernameIsTaken(username)) {
    throw new Error("That username is already taken");
  }

  const existingMeta = readSyncMeta();
  let syncPassphrase = existingMeta?.passphrase ?? "";

  if (!syncPassphrase) {
    const deviceId = existingMeta?.deviceId ?? createDeviceId();
    const room = await createSyncRoom(readState(), deviceId);
    syncPassphrase = room.meta.passphrase;
    writeRemovedIds([]);
    writeSyncMeta({
      ...room.meta,
      lastStatus: "synced",
      lastError: null,
      lastSyncedLabel: null,
    });
    ensureSyncRuntime();
  } else {
    await attachSyncPassphrase(syncPassphrase, { preferRemote: false });
  }

  const record = buildProfileRecord({
    username,
    displayName,
    syncPassphrase,
  });
  await publishProfile(username, password, record);

  const session: AuthSession = {
    username,
    displayName,
    signedInAt: new Date().toISOString(),
  };
  rememberLocalHint(session);
  writeAuthSession(session);
  return session;
}

/** Sign in on this browser and load the profile's saved fitness data. */
export async function signIn(input: {
  username: string;
  password: string;
}): Promise<AuthSession> {
  const username = validateUsername(input.username);
  const password = validatePassword(input.password);
  const record = await loadProfileRecord(username, password);

  await attachSyncPassphrase(record.syncPassphrase, {
    preferRemote: countEntities(readState()) === 0,
  });

  const session: AuthSession = {
    username: record.username,
    displayName: record.displayName,
    signedInAt: new Date().toISOString(),
  };
  rememberLocalHint(session);
  writeAuthSession(session);
  return session;
}

/**
 * Lock the app on this browser.
 * Clears the local working copy so another profile cannot inherit it.
 * The signed-out profile's data remains in the cloud and restores on sign-in.
 */
export function signOut() {
  writeAuthSession(null);
  unlinkHouseholdSync();
  writeState(emptyState(), { fromSync: true });
}

export function getLinkedHouseholdCode(): string | null {
  const meta = readSyncMeta();
  if (!meta?.passphrase) return null;
  return formatSyncCode(meta.passphrase);
}

export function suggestUsername(raw?: string): string {
  if (raw?.trim()) return normalizeUsername(raw);
  return "";
}
