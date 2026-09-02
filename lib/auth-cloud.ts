/** Profile directory using the same CORS-simple cloud stores as household sync. */

import type { ProfileCloudRecord } from "./auth";
import { packProfileRecord, unpackProfileRecord } from "./auth";

const BIN_API = "https://extendsclass.com/api/json-storage/bin";
const KV_API = "https://api.keyval.org";

export type ProfileBinBody = {
  app: "lifting-together-profile";
  payload: string;
};

function asErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Profile cloud returned invalid JSON");
  }
}

function profilePointerKey(username: string): string {
  const key = `ltuser-${username.toLowerCase()}`;
  if (key.length < 10 || key.length > 100) {
    throw new Error("Username length is invalid");
  }
  return key;
}

async function createProfileBin(body: ProfileBinBody): Promise<string> {
  try {
    const response = await fetch(BIN_API, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Could not save profile (${response.status})`);
    }
    const json = (await readJson(response)) as { id?: string };
    if (!json?.id) throw new Error("Profile cloud did not return an id");
    return json.id;
  } catch (error) {
    throw new Error(asErrorMessage(error, "Could not save profile"));
  }
}

async function readProfileBin(binId: string): Promise<ProfileBinBody | null> {
  try {
    const response = await fetch(`${BIN_API}/${encodeURIComponent(binId)}?t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Could not read profile (${response.status})`);
    }
    const json = (await readJson(response)) as ProfileBinBody | null;
    if (!json || json.app !== "lifting-together-profile" || typeof json.payload !== "string") {
      throw new Error("That username is not a Lifting Together profile");
    }
    return json;
  } catch (error) {
    throw new Error(asErrorMessage(error, "Could not read profile"));
  }
}

export async function getProfilePointer(username: string): Promise<string | null> {
  try {
    const key = profilePointerKey(username);
    const response = await fetch(`${KV_API}/get/${encodeURIComponent(key)}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Could not look up username (${response.status})`);
    }
    const json = (await readJson(response)) as { status?: string; val?: string | null };
    if (json?.status !== "SUCCESS") return null;
    const value = json.val;
    if (!value || value === "null" || value === "undefined") return null;
    return value;
  } catch (error) {
    throw new Error(asErrorMessage(error, "Could not look up username"));
  }
}

async function setProfilePointer(username: string, binId: string): Promise<void> {
  try {
    const key = profilePointerKey(username);
    const response = await fetch(
      `${KV_API}/set/${encodeURIComponent(key)}/${encodeURIComponent(binId)}`,
      { method: "GET", cache: "no-store" },
    );
    if (!response.ok) {
      throw new Error(`Could not claim username (${response.status})`);
    }
    const json = (await readJson(response)) as { status?: string };
    if (json?.status !== "SUCCESS") {
      throw new Error("Could not claim username");
    }
  } catch (error) {
    throw new Error(asErrorMessage(error, "Could not claim username"));
  }
}

export async function usernameIsTaken(username: string): Promise<boolean> {
  const binId = await getProfilePointer(username);
  return Boolean(binId);
}

export async function publishProfile(
  username: string,
  password: string,
  record: ProfileCloudRecord,
): Promise<string> {
  const payload = await packProfileRecord(password, record);
  const binId = await createProfileBin({
    app: "lifting-together-profile",
    payload,
  });
  await setProfilePointer(username, binId);
  return binId;
}

export async function loadProfileRecord(
  username: string,
  password: string,
): Promise<ProfileCloudRecord> {
  const binId = await getProfilePointer(username);
  if (!binId) {
    throw new Error("No profile found for that username");
  }
  const body = await readProfileBin(binId);
  if (!body) {
    throw new Error("No profile found for that username");
  }
  const record = await unpackProfileRecord(password, body.payload);
  if (record.username !== username) {
    throw new Error("Profile data looks corrupted");
  }
  return record;
}
