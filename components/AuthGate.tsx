"use client";

import { useSyncExternalStore } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { useAuthSession } from "@/lib/use-auth";

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return "1";
}

function getServerSnapshot() {
  return "0";
}

/** Requires a signed-in profile before showing the rest of the app. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot) === "1";
  const session = useAuthSession();

  if (!mounted) {
    return <div className="min-h-svh" aria-busy="true" />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
