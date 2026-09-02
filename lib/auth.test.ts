import { describe, expect, it } from "vitest";
import {
  buildProfileRecord,
  displayNameFromUsername,
  normalizeUsername,
  packProfileRecord,
  parseAuthSession,
  parseLocalProfileHints,
  unpackProfileRecord,
  upsertLocalProfileHint,
  validatePassword,
  validateUsername,
} from "@/lib/auth";

describe("auth helpers", () => {
  it("normalizes and validates usernames", () => {
    expect(normalizeUsername("  Lift_Duo ")).toBe("lift_duo");
    expect(validateUsername("mark_mariel")).toBe("mark_mariel");
    expect(() => validateUsername("ab")).toThrow(/3–24/);
    expect(() => validateUsername("1bad")).toThrow(/3–24/);
    expect(() => validateUsername("Bad Name!")).toThrow(/3–24/);
  });

  it("validates passwords", () => {
    expect(validatePassword("secret1")).toBe("secret1");
    expect(() => validatePassword("123")).toThrow(/6 characters/);
  });

  it("builds display names from usernames", () => {
    expect(displayNameFromUsername("lifting_duo")).toBe("Lifting Duo");
  });

  it("round-trips an encrypted profile record", async () => {
    const record = buildProfileRecord({
      username: "lifting_duo",
      displayName: "Lifting Duo",
      syncPassphrase: "ABCDEFGHJKLMNPQR",
      createdAt: "2026-09-02T00:00:00.000Z",
    });
    const packed = await packProfileRecord("secret1", record);
    const unlocked = await unpackProfileRecord("secret1", packed);
    expect(unlocked).toEqual(record);
    await expect(unpackProfileRecord("wrong-password", packed)).rejects.toThrow(/Wrong password/);
  });

  it("parses sessions and local profile hints", () => {
    expect(parseAuthSession(null)).toBeNull();
    expect(
      parseAuthSession(
        JSON.stringify({
          username: "lifting_duo",
          displayName: "Lifting Duo",
          signedInAt: "2026-09-02T00:00:00.000Z",
        }),
      ),
    ).toEqual({
      username: "lifting_duo",
      displayName: "Lifting Duo",
      signedInAt: "2026-09-02T00:00:00.000Z",
    });

    const hints = upsertLocalProfileHint([], {
      username: "a",
      displayName: "A",
      lastSignedInAt: "2026-09-02T00:00:00.000Z",
    });
    expect(parseLocalProfileHints(JSON.stringify(hints))).toEqual(hints);
    expect(
      upsertLocalProfileHint(hints, {
        username: "a",
        displayName: "A2",
        lastSignedInAt: "2026-09-03T00:00:00.000Z",
      })[0]?.displayName,
    ).toBe("A2");
  });
});
