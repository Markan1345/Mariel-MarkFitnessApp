import { describe, expect, it } from "vitest";
import {
  applyRemoteToLocal,
  buildEnvelope,
  formatSyncCode,
  mergeAppStates,
  parseSyncCode,
  packEnvelope,
  unpackEnvelope,
} from "@/lib/sync";
import { createWorkout, emptyState } from "@/lib/store";
import { createWeightEntry } from "@/lib/weight";

describe("sync codes", () => {
  it("formats and parses household codes", () => {
    const code = formatSyncCode("ab12cd3", "K7M2P9QX");
    expect(code).toBe("LT1-AB12CD3-K7M2P9QX");
    expect(parseSyncCode(code)).toEqual({ binId: "ab12cd3", passphrase: "K7M2P9QX" });
    expect(parseSyncCode("  lt1-ab12cd3-k7m2p9qx  ")).toEqual({
      binId: "ab12cd3",
      passphrase: "K7M2P9QX",
    });
    expect(parseSyncCode("nope")).toBeNull();
  });
});

describe("mergeAppStates", () => {
  it("keeps unique items from both sides and drops tombstones", () => {
    const localWorkout = createWorkout({ personId: "mark", title: "Local only" });
    const remoteWorkout = createWorkout({ personId: "mariel", title: "Remote only" });
    const sharedLocal = createWorkout({ personId: "mark", title: "Shared old" });
    const sharedRemote = { ...sharedLocal, title: "Shared new", notes: "updated" };
    const removed = createWorkout({ personId: "mark", title: "Gone" });

    const local = {
      ...emptyState(),
      workouts: [localWorkout, sharedLocal, removed],
    };
    const remote = {
      ...emptyState(),
      workouts: [remoteWorkout, sharedRemote],
    };

    const merged = mergeAppStates(local, remote, [removed.id], true);
    const titles = merged.workouts.map((workout) => workout.title).sort();
    expect(titles).toEqual(["Local only", "Remote only", "Shared new"]);
  });

  it("merges weights and plans by id", () => {
    const localWeight = createWeightEntry({ personId: "mark", date: "2026-08-01", pounds: 180 });
    const remoteWeight = createWeightEntry({ personId: "mariel", date: "2026-08-01", pounds: 140 });
    const merged = mergeAppStates(
      { ...emptyState(), weights: [localWeight] },
      { ...emptyState(), weights: [remoteWeight] },
      [],
      false,
    );
    expect(merged.weights).toHaveLength(2);
  });
});

describe("sync envelope crypto", () => {
  it("round-trips an encrypted envelope", async () => {
    const workout = createWorkout({ personId: "mark", title: "Push" });
    const envelope = buildEnvelope({
      state: { ...emptyState(), workouts: [workout] },
      deviceId: "device-1",
      removedIds: ["old_1"],
      updatedAt: "2026-08-27T05:00:00.000Z",
    });
    const packed = await packEnvelope("SECRETKEY", envelope);
    expect(packed.startsWith("v1.")).toBe(true);
    const unpacked = await unpackEnvelope("SECRETKEY", packed);
    expect(unpacked.state.workouts[0]?.title).toBe("Push");
    expect(unpacked.removedIds).toEqual(["old_1"]);
  });

  it("applies remote data onto a local device", () => {
    const localWorkout = createWorkout({ personId: "mark", title: "Desk" });
    const remoteWorkout = createWorkout({ personId: "mariel", title: "Phone" });
    const remote = buildEnvelope({
      state: { ...emptyState(), workouts: [remoteWorkout] },
      deviceId: "phone",
      removedIds: [],
    });
    const result = applyRemoteToLocal({
      local: { ...emptyState(), workouts: [localWorkout] },
      remote,
      localRemovedIds: [],
      preferRemote: true,
    });
    expect(result.state.workouts.map((workout) => workout.title).sort()).toEqual([
      "Desk",
      "Phone",
    ]);
  });
});
