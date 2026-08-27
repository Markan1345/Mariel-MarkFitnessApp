const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function asBufferSource(bytes: Uint8Array): BufferSource {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: asBufferSource(salt),
      iterations: 120_000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Encrypt JSON-serializable data with a passphrase (AES-GCM). */
export async function encryptPayload(passphrase: string, value: unknown): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: asBufferSource(iv) },
    key,
    encoder.encode(JSON.stringify(value)),
  );
  return [
    "v1",
    bytesToBase64(salt),
    bytesToBase64(iv),
    bytesToBase64(new Uint8Array(cipher)),
  ].join(".");
}

/** Decrypt a payload produced by encryptPayload. */
export async function decryptPayload<T>(passphrase: string, packed: string): Promise<T> {
  const [version, saltB64, ivB64, cipherB64] = packed.split(".");
  if (version !== "v1" || !saltB64 || !ivB64 || !cipherB64) {
    throw new Error("Invalid encrypted sync payload");
  }
  const key = await deriveKey(passphrase, base64ToBytes(saltB64));
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: asBufferSource(base64ToBytes(ivB64)) },
    key,
    asBufferSource(base64ToBytes(cipherB64)),
  );
  return JSON.parse(decoder.decode(plain)) as T;
}
