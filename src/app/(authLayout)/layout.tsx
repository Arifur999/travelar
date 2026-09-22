import Image from "next/image";

/**
 * The signed-out shell: the photograph fills the window, the form sits on it
 * in glass, on the left.
 *
 * Deliberately separate from the marketing layout — an auth page should carry
 * no navigation, so there is nothing to click away to mid-sign-in.
 *
 * Left, not centred, on purpose: the photograph is a wing over cloud with its
 * subject on the right, and a centred card would sit on top of it.
 */
const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="relative isolate min-h-screen">
    {/* Decorative: the alt is empty so a screen reader skips it rather than
        describing a photograph that carries no information. `priority`
        because this is the page's largest paint and it is above the fold. */}
    <Image
      src="/login.jpeg"
      alt=""
      fill
      priority
      sizes="100vw"
      className="-z-20 object-cover"
    />

    {/* The form side is darkened and the far side is left alone, so the glass
        has something to hold contrast against without flattening the photo. */}
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 bg-linear-to-r from-slate-950/80 via-slate-950/50 to-slate-950/10"
    />

    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-10">
      <main id="main-content" tabIndex={-1} className="flex w-full justify-center lg:w-auto">
        {children}
      </main>

      {/* Nothing here is needed to sign in, so it is the part that goes when
          the screen is too narrow to carry both. */}
      <aside className="hidden max-w-md text-right text-white lg:block">
        <p className="text-4xl leading-tight font-semibold tracking-tight drop-shadow-lg">
          Every seat, every visa,
          <br />
          every taka.
        </p>
        <p className="mt-4 text-sm text-white/80 drop-shadow">
          Tickets, visas, Hajj &amp; Umrah, tours and hotels — booked, invoiced and reconciled in
          one place.
        </p>
      </aside>
    </div>
  </div>
);

export default AuthLayout;
