"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AppIcon } from "@/components/AppIcon";
import {
  createAccount,
  readLocalProfileHints,
  signIn,
} from "@/lib/auth-client";
import { readState } from "@/lib/client-store";

type Mode = "welcome" | "create" | "signin";

function localDataSummary(): string {
  const state = readState();
  const workouts = state.workouts.length;
  const plans = state.plans?.length ?? 0;
  const weights = state.weights?.length ?? 0;
  const steps = state.stepLogs?.length ?? 0;
  const total = workouts + plans + weights + steps;
  if (total === 0) return "No saved entries on this browser yet.";
  const parts: string[] = [];
  if (workouts) parts.push(`${workouts} workout${workouts === 1 ? "" : "s"}`);
  if (plans) parts.push(`${plans} plan${plans === 1 ? "" : "s"}`);
  if (weights) parts.push(`${weights} weight log${weights === 1 ? "" : "s"}`);
  if (steps) parts.push(`${steps} step day${steps === 1 ? "" : "s"}`);
  return `This browser has ${parts.join(", ")}. Creating a profile keeps that data under your login.`;
}

export function AuthScreen() {
  const hints = useMemo(() => readLocalProfileHints(), []);
  const [mode, setMode] = useState<Mode>("welcome");
  const [username, setUsername] = useState(hints[0]?.username ?? "");
  const [displayName, setDisplayName] = useState(hints[0]?.displayName ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary] = useState(localDataSummary);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createAccount({ username, password, displayName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create profile");
    } finally {
      setBusy(false);
    }
  }

  async function onSignIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn({ username, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-4">
        <p className="eyebrow">Lifting Together</p>
        <h1 className="font-display mt-1 text-[2.65rem] leading-none">
          {mode === "create" ? "Create profile" : mode === "signin" ? "Sign in" : "Your profile"}
        </h1>
        <p className="mt-2 text-sm font-medium text-muted">
          {mode === "welcome"
            ? "Save workouts under a username so they follow you across browsers."
            : mode === "create"
              ? "Claim the data on this device and unlock it anywhere with your password."
              : "Enter the username and password for your profile."}
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 pb-8">
        {error ? (
          <p className="rounded-2xl border border-[#f0c2b6] bg-[#fff1ec] px-4 py-3 text-sm text-[#b24a34]">
            {error}
          </p>
        ) : null}

        {mode === "welcome" ? (
          <>
            <section className="surface-card px-4 py-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-energy/15 text-energy">
                  <AppIcon name="user" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-extrabold">Why a profile?</p>
                  <p className="mt-1 text-xs text-muted">
                    Each browser keeps its own copy until you sign in. A profile stores your lifts in
                    the cloud and restores them when you log in elsewhere.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs font-medium text-ink/80">{summary}</p>
            </section>

            {hints.length > 0 ? (
              <section className="surface-card px-4 py-4">
                <p className="text-sm font-extrabold">Used on this device</p>
                <div className="mt-3 flex flex-col gap-2">
                  {hints.map((hint) => (
                    <button
                      key={hint.username}
                      type="button"
                      className="rounded-2xl border border-line bg-paper px-3 py-3 text-left"
                      onClick={() => {
                        setUsername(hint.username);
                        setDisplayName(hint.displayName);
                        setMode("signin");
                      }}
                    >
                      <span className="block text-sm font-extrabold">{hint.displayName}</span>
                      <span className="mt-0.5 block text-xs text-muted">@{hint.username}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <button
              type="button"
              onClick={() => setMode("create")}
              className="w-full rounded-2xl bg-ink px-3 py-3.5 text-sm font-extrabold text-paper"
            >
              Create profile
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="w-full rounded-2xl border border-ink bg-paper px-3 py-3.5 text-sm font-extrabold text-ink"
            >
              Sign in
            </button>
          </>
        ) : null}

        {mode === "create" ? (
          <form onSubmit={(event) => void onCreate(event)} className="surface-card flex flex-col gap-3 px-4 py-4">
            <p className="text-xs text-muted">{summary}</p>
            <label className="block">
              <span className="text-xs font-bold text-muted">Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Mark & Mariel"
                className="mt-1.5 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-sm font-bold outline-none focus:border-energy"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="lifting_duo"
                required
                className="mt-1.5 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-sm font-bold outline-none focus:border-energy"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="mt-1.5 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-sm font-bold outline-none focus:border-energy"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-1 w-full rounded-2xl bg-ink px-3 py-3.5 text-sm font-extrabold text-paper disabled:opacity-60"
            >
              {busy ? "Saving profile…" : "Create & save my data"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError("");
                setMode("welcome");
              }}
              className="w-full rounded-2xl border border-line bg-paper px-3 py-3 text-sm font-extrabold text-muted disabled:opacity-60"
            >
              Back
            </button>
          </form>
        ) : null}

        {mode === "signin" ? (
          <form onSubmit={(event) => void onSignIn(event)} className="surface-card flex flex-col gap-3 px-4 py-4">
            <label className="block">
              <span className="text-xs font-bold text-muted">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                className="mt-1.5 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-sm font-bold outline-none focus:border-energy"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="mt-1.5 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-sm font-bold outline-none focus:border-energy"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-1 w-full rounded-2xl bg-ink px-3 py-3.5 text-sm font-extrabold text-paper disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError("");
                setMode("welcome");
              }}
              className="w-full rounded-2xl border border-line bg-paper px-3 py-3 text-sm font-extrabold text-muted disabled:opacity-60"
            >
              Back
            </button>
          </form>
        ) : null}
      </main>
    </div>
  );
}
