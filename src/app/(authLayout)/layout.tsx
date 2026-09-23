import Image from "next/image";
import { Building2, MapPin, Plane } from "lucide-react";

/**
 * The signed-out shell: one card floating on the photograph, the form on its
 * left and the same photograph, sharp, on its right.
 *
 * The background is that image blurred and pushed back, so the card reads as a
 * window onto the picture rather than a box dropped on top of one.
 *
 * Deliberately separate from the marketing layout — an auth page should carry
 * no navigation, so there is nothing to click away to mid-sign-in.
 */
const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-8">
    {/* Decorative: empty alt so a screen reader skips a photograph that carries
        no information. Scaled up because a blur this wide eats its own edges. */}
    <Image
      src="/login2.jpeg"
      alt=""
      fill
      priority
      sizes="100vw"
      className="-z-20 scale-110 object-cover blur-2xl"
    />
    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-slate-950/25" />

    <div className="w-full max-w-7xl overflow-hidden rounded-[2.5rem] bg-card shadow-2xl">
      {/* Not an even split: the form side carries the work, and at half of
          this card it came out narrower than it was before. */}
      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        <main
          id="main-content"
          tabIndex={-1}
          className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14 lg:py-14"
        >
          {children}
        </main>

        {/* The picture half carries nothing you need in order to sign in, so it
            is what goes when the screen is too narrow for both. */}
        <div className="relative hidden min-h-[36rem] overflow-hidden rounded-[2rem] lg:m-3 lg:block">
          <Image
            src="/login2.jpeg"
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover"
          />

          {/* Labels pinned on the photo the way a map pins a place. They say
              what the product covers — no invented numbers, nothing that has to
              be kept true later. */}
          <div className="absolute top-8 left-8 flex items-center gap-3 rounded-2xl bg-slate-900/55 px-4 py-3 text-white backdrop-blur-md">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/20">
              <Plane className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm leading-tight">
              Air tickets &amp; visas
              <span className="block font-semibold">booked and invoiced</span>
            </span>
          </div>

          <div className="absolute top-1/3 right-8 max-w-52 rounded-2xl bg-slate-900/55 px-4 py-3 text-white backdrop-blur-md">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="size-4" aria-hidden="true" />
              Hajj, Umrah &amp; tours
            </p>
            <p className="mt-1 text-xs text-white/80">
              Seats, rooms and payments on one booking
            </p>
          </div>

          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold whitespace-nowrap text-slate-900 backdrop-blur-md">
            <Building2 className="size-4" aria-hidden="true" />
            Every seat, every visa, every taka
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AuthLayout;
