import { describe, expect, it } from "vitest";
import { buildProfileRecord } from "@/lib/auth";
import { loadProfileRecord, publishProfile, usernameIsTaken } from "@/lib/auth-cloud";
import { createPassphrase } from "@/lib/sync";

describe("profile cloud login", () => {
  it(
    "publishes a profile and unlocks it with the password",
    async () => {
      const username = `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      expect(await usernameIsTaken(username)).toBe(false);

      const record = buildProfileRecord({
        username,
        displayName: "Test Lifter",
        syncPassphrase: createPassphrase(),
      });
      await publishProfile(username, "secret1", record);
      expect(await usernameIsTaken(username)).toBe(true);

      const loaded = await loadProfileRecord(username, "secret1");
      expect(loaded.username).toBe(username);
      expect(loaded.displayName).toBe("Test Lifter");
      expect(loaded.syncPassphrase).toBe(record.syncPassphrase);

      await expect(loadProfileRecord(username, "nope-nope")).rejects.toThrow(/Wrong password|unlock/);
    },
    30_000,
  );
});
