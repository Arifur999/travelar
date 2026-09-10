import Link from "next/link";

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <p className="font-display text-5xl font-semibold tracking-tight">
        <span className="text-primary">Trav</span>
        <span className="text-accent">elar</span>
      </p>

      <p className="max-w-xl text-muted-foreground">
        Ticketing, visa processing, Hajj &amp; Umrah and billing — one workspace per agency.
      </p>

      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-full border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Register your agency
        </Link>
      </div>
    </main>
  );
}
