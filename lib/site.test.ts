import { describe, expect, it } from "vitest";
import { getDefaultHouseholdPassphrase } from "@/lib/site";

describe("getDefaultHouseholdPassphrase", () => {
  it("returns the stable deployment default", () => {
    expect(getDefaultHouseholdPassphrase()).toBe("MARIELMARKFITAPP");
  });
});
