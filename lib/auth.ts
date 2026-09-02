import { decryptPayload, encryptPayload } from "./sync-crypto";

export const AUTH_SESSION_KEY = "mm-fitness-session-v1";
export const AUTH_LOCAL_PROFILES_KEY = "mm-fitness-local-profiles-v1";

export type ProfileCloudRecord = {
  v: 1;
  app: "lifting-together-profile";
  username: string;
  displayName: string;
  /** Household sync passphrase that holds this profile's fitness data. */
  syncPassphrase: string;
  createdAt: string;
};

export type AuthSession = {
  username: string;
  displayName: string;
  signedInAt: string;
};

export type LocalProfileHint = {
  username: string;
  displayName: string;
  lastSignedInAt: string;
};

const USERNAME_RE = /^[a-z][a-z0-9_]{2,23}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}

export function validateUsername(raw: string): string {
  const username = normalizeUsername(raw);
  if (!USERNAME_RE.test(username)) {
    throw new Error("Use 3–24 characters: start with a letter, then letters, numbers, or _");
  }
  return username;
}

export function validatePassword(password: string): string {
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  if (password.length > 128) {
    throw new Error("Password is too long");
  }
  return password;
}

export function displayNameFromUsername(username: string): string {
  return username
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isProfileCloudRecord(value: unknown): value is ProfileCloudRecord {
  if (!value || typeof value !== "object") return false;
  const candidate = value as ProfileCloudRecord;
  return (
    candidate.v === 1 &&
    candidate.app === "lifting-together-profile" &&
    typeof candidate.username === "string" &&
    typeof candidate.displayName === "string" &&
    typeof candidate.syncPassphrase === "string" &&
    typeof candidate.createdAt === "string"
  );
}

export function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as AuthSession;
  return (
    typeof candidate.username === "string" &&
    typeof candidate.displayName === "string" &&
    typeof candidate.signedInAt === "string"
  );
}

export function parseAuthSession(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseLocalProfileHints(raw: string | null): LocalProfileHint[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is LocalProfileHint => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as LocalProfileHint;
      return (
        typeof candidate.username === "string" &&
        typeof candidate.displayName === "string" &&
        typeof candidate.lastSignedInAt === "string"
      );
    });
  } catch {
    return [];
  }
}

export function upsertLocalProfileHint(
  hints: LocalProfileHint[],
  next: LocalProfileHint,
): LocalProfileHint[] {
  const without = hints.filter((hint) => hint.username !== next.username);
  return [next, ...without].slice(0, 8);
}

export async function packProfileRecord(
  password: string,
  record: ProfileCloudRecord,
): Promise<string> {
  return encryptPayload(password, record);
}

export async function unpackProfileRecord(
  password: string,
  payload: string,
): Promise<ProfileCloudRecord> {
  try {
    const parsed = await decryptPayload<unknown>(password, payload);
    if (!isProfileCloudRecord(parsed)) {
      throw new Error("Profile data looks corrupted");
    }
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.message === "Profile data looks corrupted") {
      throw error;
    }
    throw new Error("Wrong password or profile could not be unlocked");
  }
}

export function buildProfileRecord(input: {
  username: string;
  displayName: string;
  syncPassphrase: string;
  createdAt?: string;
}): ProfileCloudRecord {
  return {
    v: 1,
    app: "lifting-together-profile",
    username: input.username,
    displayName: input.displayName.trim() || displayNameFromUsername(input.username),
    syncPassphrase: input.syncPassphrase,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}
