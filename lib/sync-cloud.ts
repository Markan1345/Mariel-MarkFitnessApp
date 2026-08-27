/** Cloud sync using only CORS "simple" requests (no preflight). */

const BIN_API = "https://extendsclass.com/api/json-storage/bin";
const KV_API = "https://api.keyval.org";

export type CloudBinBody = {
  app: "lifting-together";
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
    throw new Error("Cloud sync returned invalid JSON");
  }
}

function pointerKey(passphrase: string): string {
  const key = `ltsync-${passphrase.toLowerCase()}`;
  if (key.length < 10 || key.length > 100) {
    throw new Error("Sync code length is invalid");
  }
  return key;
}

/** Create an immutable encrypted blob. Returns the public bin id. */
export async function createCloudBin(body: CloudBinBody): Promise<string> {
  try {
    // text/plain keeps this a CORS simple request (no OPTIONS preflight).
    const response = await fetch(BIN_API, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Could not create sync snapshot (${response.status})`);
    }
    const json = (await readJson(response)) as { id?: string };
    if (!json?.id) throw new Error("Cloud sync did not return a snapshot id");
    return json.id;
  } catch (error) {
    throw new Error(asErrorMessage(error, "Could not create sync snapshot"));
  }
}

/** Read an encrypted blob by id. */
export async function readCloudBin(binId: string): Promise<CloudBinBody | null> {
  try {
    const response = await fetch(`${BIN_API}/${encodeURIComponent(binId)}?t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Could not read sync snapshot (${response.status})`);
    }
    const json = (await readJson(response)) as CloudBinBody | null;
    if (!json || json.app !== "lifting-together" || typeof json.payload !== "string") {
      throw new Error("That sync code is not a Lifting Together room");
    }
    return json;
  } catch (error) {
    throw new Error(asErrorMessage(error, "Could not read sync snapshot"));
  }
}

/** Point the household code at the latest snapshot id (KeyVal GET write). */
export async function setHouseholdPointer(passphrase: string, binId: string): Promise<void> {
  try {
    const key = pointerKey(passphrase);
    const response = await fetch(
      `${KV_API}/set/${encodeURIComponent(key)}/${encodeURIComponent(binId)}`,
      { method: "GET", cache: "no-store" },
    );
    if (!response.ok) {
      throw new Error(`Could not publish sync pointer (${response.status})`);
    }
    const json = (await readJson(response)) as { status?: string; val?: string };
    if (json?.status !== "SUCCESS") {
      throw new Error("Could not publish sync pointer");
    }
  } catch (error) {
    throw new Error(asErrorMessage(error, "Could not publish sync pointer"));
  }
}

/** Resolve the latest snapshot id for a household code. */
export async function getHouseholdPointer(passphrase: string): Promise<string | null> {
  try {
    const key = pointerKey(passphrase);
    const response = await fetch(`${KV_API}/get/${encodeURIComponent(key)}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Could not resolve sync pointer (${response.status})`);
    }
    const json = (await readJson(response)) as { status?: string; val?: string | null };
    if (json?.status !== "SUCCESS") return null;
    const value = json.val;
    if (!value || value === "null" || value === "undefined") return null;
    return value;
  } catch (error) {
    throw new Error(asErrorMessage(error, "Could not resolve sync pointer"));
  }
}

/** Write a new snapshot and point the household at it. */
export async function publishSnapshot(
  passphrase: string,
  body: CloudBinBody,
): Promise<string> {
  const binId = await createCloudBin(body);
  await setHouseholdPointer(passphrase, binId);
  return binId;
}

/** Load the latest snapshot for a household passphrase. */
export async function loadLatestSnapshot(
  passphrase: string,
): Promise<{ binId: string; body: CloudBinBody } | null> {
  const binId = await getHouseholdPointer(passphrase);
  if (!binId) return null;
  const body = await readCloudBin(binId);
  if (!body) return null;
  return { binId, body };
}
