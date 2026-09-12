import Link from "next/link";
import { Plane } from "lucide-react";

/**
 * The signed-out shell: a centred card on a branded ground.
 *
 * Deliberately separate from the marketing layout — an auth page should carry
 * no navigation, so there is nothing to click away to mid-sign-in.
 */
const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-muted/40 px-4 py-10">
    {/* Decorative brand wash. aria-hidden so it is not announced. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-40 -right-32 size-96 rounded-full bg-primary/10 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-40 -left-32 size-96 rounded-full bg-ledger/10 blur-3xl"
    />

    <Link
      href="/"
      className="mb-8 flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Plane className="size-5" aria-hidden="true" />
      </span>
      Travelar
    </Link>

    <main id="main-content" tabIndex={-1} className="w-full max-w-md">
      {children}
    </main>

    <p className="mt-8 text-center text-xs text-muted-foreground">
      Travel agency management — ticketing, visa, Hajj &amp; Umrah, and accounts.
    </p>
  </div>
);

export default AuthLayout;
