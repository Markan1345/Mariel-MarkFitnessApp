"use client";

import { useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { AppNav } from "@/components/AppNav";
import { getLinkedHouseholdCode, signOut } from "@/lib/auth-client";
import { useAuthSession } from "@/lib/use-auth";
import { countdownLabel } from "@/lib/sync";
import { readSyncMeta, subscribeToSyncMeta, syncNow } from "@/lib/sync-client";
import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";

function getMetaSnapshot() {
  return JSON.stringify(readSyncMeta());
}

function getServerMetaSnapshot() {
  return "null";
}

export default function AccountPage() {
  const session = useAuthSession();
  const rawMeta = useSyncExternalStore(subscribeToSyncMeta, getMetaSnapshot, getServerMetaSnapshot);
  const meta = useMemo(() => (rawMeta === "null" ? null : JSON.parse(rawMeta)), [rawMeta]);
  const code = getLinkedHouseholdCode();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await syncNow();
      setMessage("Profile data is up to date.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    if (
      !window.confirm(
        "Sign out on this browser? Your profile data stays in the cloud and comes back when you sign in again.",
      )
    ) {
      return;
    }
    signOut();
  }

  if (!session) return null;

  const lastLabel = countdownLabel(meta?.lastSyncedAt ?? null) ?? meta?.lastSyncedLabel;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-4">
        <p className="eyebrow">Signed in</p>
        <h1 className="font-display mt-1 text-[2.65rem] leading-none">Account</h1>
        <p className="mt-2 text-sm font-medium text-muted">
          Your workouts, plans, steps, and weights stay on this profile.
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 pb-8">
        <section className="surface-card px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold">{session.displayName}</p>
              <p className="mt-1 text-xs text-muted">@{session.username}</p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-energy/15 text-energy">
              <AppIcon name="user" className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-xs text-muted">
            {lastLabel ? `Last cloud save ${lastLabel}` : "Waiting for the first cloud save"}
          </p>
          {error ? <p className="mt-3 text-sm text-[#b24a34]">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-mark">{message}</p> : null}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void refresh()}
              className="rounded-2xl bg-ink px-3 py-3 text-sm font-extrabold text-paper disabled:opacity-60"
            >
              {busy ? "Refreshing…" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-2xl border border-line bg-paper px-3 py-3 text-sm font-extrabold text-muted"
            >
              Sign out
            </button>
          </div>
        </section>

        <section className="surface-card px-4 py-4">
          <p className="text-sm font-extrabold">Other browsers</p>
          <p className="mt-1 text-xs text-muted">
            Open this app in another browser, choose Sign in, and use the same username and password.
            Your saved data loads automatically.
          </p>
        </section>

        {code ? (
          <section className="surface-card px-4 py-4">
            <p className="text-sm font-extrabold">Household sync code</p>
            <p className="mt-1 text-xs text-muted">
              Optional: share this with Sync on another device without signing in as this profile.
            </p>
            <p className="mt-3 break-all rounded-2xl border border-line bg-paper px-3 py-3 font-mono text-sm font-bold">
              {code}
            </p>
            <Link href="/sync" className="mt-3 inline-block text-sm font-extrabold text-energy">
              Open Sync settings
            </Link>
          </section>
        ) : null}
      </main>

      <AppNav />
    </div>
  );
}
