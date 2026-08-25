import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="text-sm tracking-[0.22em] text-muted uppercase">Missing page</p>
      <h1 className="font-display mt-3 text-4xl">Nothing here</h1>
      <p className="mt-3 max-w-[28ch] text-muted">
        That person or session is not part of this tracker.
      </p>
      <Link href="/" className="mt-6 font-medium text-ink underline">
        Back home
      </Link>
    </main>
  );
}
