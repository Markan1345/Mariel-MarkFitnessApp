"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  isSignedIn,
  readAuthSession,
  readLocalProfileHints,
  subscribeToAuth,
} from "@/lib/auth-client";
import type { AuthSession, LocalProfileHint } from "@/lib/auth";

function getSessionSnapshot() {
  return JSON.stringify(readAuthSession());
}

function getServerSessionSnapshot() {
  return "null";
}

function getHintsSnapshot() {
  return JSON.stringify(readLocalProfileHints());
}

function getServerHintsSnapshot() {
  return "[]";
}

export function useAuthSession(): AuthSession | null {
  const raw = useSyncExternalStore(subscribeToAuth, getSessionSnapshot, getServerSessionSnapshot);
  return useMemo(() => (raw === "null" ? null : (JSON.parse(raw) as AuthSession)), [raw]);
}

export function useIsSignedIn(): boolean {
  return Boolean(useAuthSession()?.username) || false;
}

export function useLocalProfileHints(): LocalProfileHint[] {
  const raw = useSyncExternalStore(subscribeToAuth, getHintsSnapshot, getServerHintsSnapshot);
  return useMemo(() => JSON.parse(raw) as LocalProfileHint[], [raw]);
}

export function useAuthReadySignedIn(): boolean {
  const session = useAuthSession();
  return Boolean(session?.username) && isSignedIn();
}
