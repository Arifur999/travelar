"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RiCloudOffLine, RiRefreshLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";

/**
 * Shown when the API cannot be reached, in place of the dashboard shell.
 *
 * This exists because the alternative was worse: the shell used to redirect to
 * /login whenever it could not load the user, so an outage silently signed
 * everyone out — and signing back in failed too, since that needs the same API.
 * The message has to say the data is safe, because from the user's side an
 * empty dashboard and a lost account look identical.
 */
const ServiceUnavailable = () => {
  const router = useRouter();
  const [isRetrying, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
          <RiCloudOffLine className="size-7 text-muted-foreground" aria-hidden="true" />
        </div>

        <h1 className="mt-6 text-xl font-semibold">Can&apos;t reach Travelar right now</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You are still signed in and none of your data is affected — the server just is not
          answering. This is usually brief.
        </p>

        <Button
          onClick={() => startTransition(() => router.refresh())}
          disabled={isRetrying}
          className="mt-6 rounded-full"
        >
          <RiRefreshLine className={`size-4 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
          {isRetrying ? "Checking..." : "Try again"}
        </Button>

        <p className="mt-6 text-xs text-muted-foreground">
          If it keeps happening, tell your administrator the API is unreachable.
        </p>
      </div>
    </div>
  );
};

export default ServiceUnavailable;
