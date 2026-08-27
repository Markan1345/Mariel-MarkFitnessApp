const API_BASE = "https://extendsclass.com/api/json-storage/bin";

export type CloudBinBody = {
  /** Always present so we can ignore unrelated bins. */
  app: "lifting-together";
  /** Encrypted SyncEnvelope string. */
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

/** Create a new cloud bin. Returns the public bin id. */
export async function createCloudBin(
  securityKey: string,
  body: CloudBinBody,
): Promise<string> {
  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Security-key": securityKey,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Could not create sync room (${response.status})`);
    }
    const json = (await readJson(response)) as { id?: string; status?: number };
    if (!json?.id) throw new Error("Cloud sync did not return a room id");
    return json.id;
  } catch (error) {
    throw new Error(asErrorMessage(error, "Could not create sync room"));
  }
}

/** Read a cloud bin (public GET). Uses a cache-buster to avoid stale CDN copies. */
export async function readCloudBin(binId: string): Promise<CloudBinBody | null> {
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(binId)}?t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Could not read sync room (${response.status})`);
    }
    const json = (await readJson(response)) as CloudBinBody | null;
    if (!json || json.app !== "lifting-together" || typeof json.payload !== "string") {
      throw new Error("That sync code is not a Lifting Together room");
    }
    return json;
  } catch (error) {
    throw new Error(asErrorMessage(error, "Could not read sync room"));
  }
}

/** Replace cloud bin contents. Requires the security key set at creation. */
export async function writeCloudBin(
  binId: string,
  securityKey: string,
  body: CloudBinBody,
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(binId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Security-key": securityKey,
      },
      body: JSON.stringify(body),
    });
    if (response.status === 401) {
      throw new Error("Wrong sync code for this room");
    }
    if (!response.ok) {
      throw new Error(`Could not save sync room (${response.status})`);
    }
  } catch (error) {
    throw new Error(asErrorMessage(error, "Could not save sync room"));
  }
}
