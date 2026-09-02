"use client";

import { useMemo, useSyncExternalStore } from "react";
import { readAuthSession, subscribeToAuth } from "@/lib/auth-client";
import type { AuthSession } from "@/lib/auth";

function getSessionSnapshot() {
  return JSON.stringify(readAuthSession());
}

function getServerSessionSnapshot() {
  return "null";
}

export function useAuthSession(): AuthSession | null {
  const raw = useSyncExternalStore(subscribeToAuth, getSessionSnapshot, getServerSessionSnapshot);
  return useMemo(() => (raw === "null" ? null : (JSON.parse(raw) as AuthSession)), [raw]);
}
