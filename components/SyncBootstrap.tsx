"use client";

import { useEffect } from "react";
import { ensureSyncRuntime } from "@/lib/sync-client";

/** Starts background cloud sync when this device is linked. */
export function SyncBootstrap() {
  useEffect(() => {
    ensureSyncRuntime();
  }, []);
  return null;
}
