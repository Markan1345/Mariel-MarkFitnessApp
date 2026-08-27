"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { AppIcon } from "@/components/AppIcon";
import { AppNav } from "@/components/AppNav";
import { emptyState } from "@/lib/store";
import {
  createHouseholdSync,
  getSyncCode,
  isSyncLinked,
  joinHouseholdSync,
  readSyncMeta,
  subscribeToSyncMeta,
  syncNow,
  unlinkHouseholdSync,
} from "@/lib/sync-client";
import { countdownLabel, exportStateJson, importStateJson, parseSyncCode } from "@/lib/sync";
import { readState, writeState } from "@/lib/client-store";

function getMetaSnapshot() {
  return JSON.stringify(readSyncMeta());
}

function getServerMetaSnapshot() {
  return "null";
}

export default function SyncPage() {
  const rawMeta = useSyncExternalStore(subscribeToSyncMeta, getMetaSnapshot, getServerMetaSnapshot);
  const meta = useMemo(() => (rawMeta === "null" ? null : JSON.parse(rawMeta)), [rawMeta]);
  const linked = Boolean(meta?.passphrase);
  const code = linked ? getSyncCode() : null;

  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function startSync() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const nextCode = await createHouseholdSync();
      setMessage(`Sync is on. Enter this code on your other devices.`);
      setJoinCode(nextCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start sync");
    } finally {
      setBusy(false);
    }
  }

  async function joinSync() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!parseSyncCode(joinCode)) {
        throw new Error("Use a code like LT1-K7M2P9QXH4W8N3YT");
      }
      await joinHouseholdSync(joinCode);
      setMessage("This device is linked. Workouts will stay in sync.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join sync");
    } finally {
      setBusy(false);
    }
  }

  async function runSync() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await syncNow();
      setMessage("Up to date.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy. Long-press the code to copy it.");
    }
  }

  function unlink() {
    unlinkHouseholdSync();
    setMessage("This device is local-only again.");
    setError("");
  }

  function downloadBackup() {
    const blob = new Blob([exportStateJson(readState())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lifting-together-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function restoreBackup(file: File) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const text = await file.text();
      const state = importStateJson(text);
      writeState(state);
      if (isSyncLinked()) {
        await syncNow({ preferRemote: false });
      }
      setMessage("Backup restored on this device.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore backup");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel =
    meta?.lastStatus === "syncing"
      ? "Syncing…"
      : meta?.lastStatus === "error"
        ? "Needs attention"
        : linked
          ? "Linked"
          : "Not linked";
  const lastLabel = countdownLabel(meta?.lastSyncedAt ?? null) ?? meta?.lastSyncedLabel;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-4">
        <p className="eyebrow">Across your devices</p>
        <h1 className="font-display mt-1 text-[2.65rem] leading-none">Sync</h1>
        <p className="mt-2 text-sm font-medium text-muted">
          Keep Mark &amp; Mariel&apos;s plans, workouts, and weights the same on phone and desktop.
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 pb-8">
        <section className="surface-card px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold">{statusLabel}</p>
              <p className="mt-1 text-xs text-muted">
                {linked
                  ? lastLabel
                    ? `Last sync ${lastLabel}`
                    : "Waiting for the first sync"
                  : "Each browser keeps its own copy until you link them"}
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-energy/15 text-energy">
              <AppIcon name="spark" className="h-5 w-5" />
            </span>
          </div>
          {meta?.lastError ? (
            <p className="mt-3 text-sm text-[#b24a34]">{meta.lastError}</p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-[#b24a34]">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-mark">{message}</p> : null}
        </section>

        {linked && code ? (
          <section className="surface-card px-4 py-4">
            <p className="text-sm font-extrabold">Household code</p>
            <p className="mt-1 text-xs text-muted">
              Open Sync on another phone or computer and paste this code.
            </p>
            <button
              type="button"
              onClick={() => void copyCode()}
              className="mt-3 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-left font-mono text-sm font-bold tracking-wide break-all text-ink"
            >
              {code}
            </button>
            <p className="mt-2 text-xs text-muted">{copied ? "Copied" : "Tap to copy"}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void runSync()}
                className="rounded-2xl bg-ink px-3 py-3 text-sm font-extrabold text-paper disabled:opacity-60"
              >
                Sync now
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={unlink}
                className="rounded-2xl border border-line bg-paper px-3 py-3 text-sm font-extrabold text-muted disabled:opacity-60"
              >
                Unlink device
              </button>
            </div>
          </section>
        ) : (
          <section className="surface-card px-4 py-4">
            <p className="text-sm font-extrabold">Start on this device</p>
            <p className="mt-1 text-xs text-muted">
              Creates a private household room and a code for your other devices.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void startSync()}
              className="mt-4 w-full rounded-2xl bg-ink px-3 py-3 text-sm font-extrabold text-paper disabled:opacity-60"
            >
              {busy ? "Working…" : "Create household sync"}
            </button>
          </section>
        )}

        <section className="surface-card px-4 py-4">
          <p className="text-sm font-extrabold">{linked ? "Link another way" : "Join with a code"}</p>
          <p className="mt-1 text-xs text-muted">
            Paste the household code from your phone or desktop.
          </p>
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder="LT1-………………"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="mt-3 w-full rounded-2xl border border-line bg-paper px-3 py-3 font-mono text-sm font-bold tracking-wide outline-none focus:border-energy"
          />
          <button
            type="button"
            disabled={busy || !joinCode.trim()}
            onClick={() => void joinSync()}
            className="mt-3 w-full rounded-2xl border border-ink bg-paper px-3 py-3 text-sm font-extrabold text-ink disabled:opacity-60"
          >
            Join household
          </button>
        </section>

        <section className="surface-card px-4 py-4">
          <p className="text-sm font-extrabold">Backup file</p>
          <p className="mt-1 text-xs text-muted">
            Optional: download or restore a JSON copy if you ever need a manual handoff.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={downloadBackup}
              className="rounded-2xl border border-line bg-paper px-3 py-3 text-sm font-extrabold"
            >
              Download
            </button>
            <label className="rounded-2xl border border-line bg-paper px-3 py-3 text-center text-sm font-extrabold">
              Restore
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void restoreBackup(file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          <button
            type="button"
            className="mt-3 w-full rounded-2xl border border-dashed border-line px-3 py-3 text-sm font-bold text-muted"
            onClick={() => {
              if (
                window.confirm(
                  "Clear all workouts, plans, and weights on this device only?",
                )
              ) {
                writeState(emptyState());
                setMessage("This device was cleared.");
              }
            }}
          >
            Clear this device
          </button>
        </section>
      </main>

      <AppNav />
    </div>
  );
}
