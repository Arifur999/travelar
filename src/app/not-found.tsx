import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 size-96 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="text-center">
        <p className="font-display text-5xl font-semibold tracking-tight">
          <span className="text-primary">Trav</span>
          <span className="text-ledger">elar</span>
        </p>

        <h1 className="mt-6 text-xl font-semibold">Page not found</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          That page does not exist, or it belongs to another agency.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
