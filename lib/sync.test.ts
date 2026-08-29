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
import { createStepLog } from "@/lib/steps";
import { createWeightEntry } from "@/lib/weight";

describe("sync codes", () => {
  it("formats and parses household codes", () => {
    const code = formatSyncCode("K7M2P9QXH4W8N3YT");
    expect(code).toBe("LT1-K7M2P9QXH4W8N3YT");
    expect(parseSyncCode(code)).toEqual({ passphrase: "K7M2P9QXH4W8N3YT" });
    expect(parseSyncCode("  lt1-k7m2p9qxh4w8n3yt  ")).toEqual({
      passphrase: "K7M2P9QXH4W8N3YT",
    });
    expect(parseSyncCode("LT1-oldbin-K7M2P9QXH4W8N3YT")).toEqual({
      passphrase: "K7M2P9QXH4W8N3YT",
    });
    expect(parseSyncCode("nope")).toBeNull();
  });
});

describe("mergeAppStates", () => {
  it("keeps unique items from both sides and drops tombstones", () => {
    const localWorkout = createWorkout({ personId: "mark", title: "Local only" });
    const remoteWorkout = createWorkout({ personId: "mariel", title: "Remote only" });
    const sharedLocal = {
      ...createWorkout({ personId: "mark", title: "Shared old", startedAt: "2026-08-27T10:00:00.000Z" }),
      updatedAt: "2026-08-27T10:00:00.000Z",
    };
    const sharedRemote = {
      ...sharedLocal,
      title: "Shared new",
      notes: "updated",
      updatedAt: "2026-08-28T12:00:00.000Z",
    };
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

  it("keeps locally logged sets when a newer remote envelope still has empty sets", () => {
    const startedAt = "2026-08-28T18:00:00.000Z";
    const base = createWorkout({
      personId: "mark",
      title: "Push",
      exerciseNames: ["Barbell bench press"],
      startedAt,
    });
    const remoteEmpty = {
      ...base,
      updatedAt: startedAt,
    };
    const localLogged = {
      ...base,
      updatedAt: "2026-08-28T18:45:00.000Z",
      exercises: base.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({
          ...set,
          weight: 185,
          reps: 5,
          completed: true,
        })),
      })),
    };

    const merged = mergeAppStates(
      { ...emptyState(), workouts: [localLogged] },
      { ...emptyState(), workouts: [remoteEmpty] },
      [],
      true,
    );

    expect(merged.workouts).toHaveLength(1);
    expect(merged.workouts[0]?.exercises[0]?.sets[0]?.weight).toBe(185);
    expect(merged.workouts[0]?.exercises[0]?.sets[0]?.completed).toBe(true);
  });

  it("prefers richer logged sets when updatedAt ties on legacy workouts", () => {
    const startedAt = "2026-08-28T17:00:00.000Z";
    const base = createWorkout({
      personId: "mariel",
      title: "Legs",
      exerciseNames: ["Back squat"],
      startedAt,
    });
    const empty = { ...base, updatedAt: startedAt };
    const logged = {
      ...base,
      updatedAt: startedAt,
      exercises: base.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({
          ...set,
          weight: 135,
          reps: 5,
          completed: true,
        })),
      })),
    };

    const merged = mergeAppStates(
      { ...emptyState(), workouts: [logged] },
      { ...emptyState(), workouts: [empty] },
      [],
      true,
    );
    expect(merged.workouts[0]?.exercises[0]?.sets[0]?.weight).toBe(135);
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

  it("merges daily step logs", () => {
    const localSteps = createStepLog({ personId: "mark", date: "2026-08-27", phoneSteps: 1000 });
    const remoteSteps = createStepLog({ personId: "mariel", date: "2026-08-27", phoneSteps: 4000 });
    const merged = mergeAppStates(
      { ...emptyState(), stepLogs: [localSteps] },
      { ...emptyState(), stepLogs: [remoteSteps] },
      [],
      true,
    );
    expect(merged.stepLogs).toHaveLength(2);
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
