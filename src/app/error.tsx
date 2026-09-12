"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Next 16: the recovery prop is `retry` — stable since 16.3.0, and named
 * `unstable_retry` in 16.2.x. It is NOT `reset`: `reset()` clears the error
 * state without re-fetching, so the same failure usually renders straight back.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-32 size-96 rounded-full bg-destructive/10 blur-3xl"
      />

      <div className="text-center">
        <p className="font-display text-5xl font-semibold tracking-tight">
          <span className="text-primary">Trav</span>
          <span className="text-ledger">elar</span>
        </p>

        <h1 className="mt-6 text-xl font-semibold">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          The page could not be loaded. Trying again usually resolves it — the error has been
          logged.
        </p>

        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => retry()} className="rounded-full">
            Try again
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
