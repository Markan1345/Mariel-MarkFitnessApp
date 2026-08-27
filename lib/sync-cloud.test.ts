import { describe, expect, it } from "vitest";
import { createWorkout, emptyState } from "@/lib/store";
import { createWeightEntry } from "@/lib/weight";
import {
  applyRemoteToLocal,
  buildEnvelope,
  createSyncRoom,
  fetchRemoteEnvelope,
  pushEnvelope,
} from "@/lib/sync";

describe("cloud household sync", () => {
  it(
    "publishes from one device and loads on another",
    async () => {
      const phoneState = {
        ...emptyState(),
        workouts: [
          createWorkout({
            personId: "mark",
            title: "Phone push day",
            exerciseNames: ["Barbell bench press"],
          }),
        ],
        weights: [createWeightEntry({ personId: "mark", date: "2026-08-27", pounds: 182 })],
      };

      const room = await createSyncRoom(phoneState, "phone-device");
      expect(room.code.startsWith("LT1-")).toBe(true);

      const remote = await fetchRemoteEnvelope(room.meta.passphrase);
      expect(remote?.state.workouts[0]?.title).toBe("Phone push day");

      const desktop = applyRemoteToLocal({
        local: emptyState(),
        remote: remote!,
        localRemovedIds: [],
        preferRemote: true,
      });
      expect(desktop.state.weights[0]?.pounds).toBe(182);

      const withMariel = {
        ...desktop.state,
        workouts: [
          ...desktop.state.workouts,
          createWorkout({
            personId: "mariel",
            title: "Desktop pull day",
            exerciseNames: ["Barbell row"],
          }),
        ],
      };
      await pushEnvelope(
        room.meta.passphrase,
        buildEnvelope({
          state: withMariel,
          deviceId: "desktop-device",
          removedIds: desktop.removedIds,
        }),
      );

      const phonePull = await fetchRemoteEnvelope(room.meta.passphrase);
      const merged = applyRemoteToLocal({
        local: phoneState,
        remote: phonePull!,
        localRemovedIds: [],
        preferRemote: true,
      });
      expect(merged.state.workouts.map((workout) => workout.title).sort()).toEqual([
        "Desktop pull day",
        "Phone push day",
      ]);
    },
    30_000,
  );
});
