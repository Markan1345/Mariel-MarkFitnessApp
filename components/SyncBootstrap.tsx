"use client";

import { useEffect } from "react";
import { ensureAutoHouseholdSync } from "@/lib/sync-client";

/** Starts automatic cloud sync so data follows you across browsers. */
export function SyncBootstrap() {
  useEffect(() => {
    void ensureAutoHouseholdSync();
  }, []);
  return null;
}
