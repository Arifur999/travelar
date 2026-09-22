import Link from "next/link";
import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * The glass panel every signed-out page sits in.
 *
 * Really glass: the photograph shows through it, blurred, instead of being
 * covered by a white card. That only works if everything inside is repainted
 * for a dark, translucent ground — a default shadcn input is a solid white
 * box and would punch a hole straight through the effect. The overrides below
 * do that, scoped to this panel so no other form in the app is touched.
 *
 * `.auth-glass` also carries the autofill rule in globals.css: Chrome paints
 * its own opaque slab over an autofilled field, which is exactly the white
 * box this is avoiding.
 */
const AuthCard = ({ title, description, children }: AuthCardProps) => (
  <div
    className={cn(
      "auth-glass w-full max-w-2xl rounded-3xl border border-white/25 bg-white/10 p-8 text-white shadow-2xl backdrop-blur-2xl sm:p-10",
      // Labels, fields and the muted lines under them, repainted for glass.
      "[&_label]:text-white/90",
      "[&_input]:border-white/30 [&_input]:bg-white/10 [&_input]:text-white",
      "[&_input]:focus-visible:border-white/60 [&_input]:focus-visible:ring-white/30",
      "[&_.text-muted-foreground]:text-white/70",
      // Links read as part of the panel rather than as blue on a photo.
      "[&_a]:text-white [&_a]:underline-offset-4 [&_a:hover]:underline",
      // The password reveal is a ghost button; its light hover would flash a
      // white square on the glass.
      "[&_button[aria-label]]:hover:bg-white/15 [&_button[aria-label]]:hover:text-white",
      // A field error still has to shout, and destructive red goes muddy on a
      // dark ground.
      "**:[[role=alert]]:text-red-200",
    )}
  >
    <Link
      href="/"
      className="mb-8 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-white no-underline"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
        <Plane className="size-5" aria-hidden="true" />
      </span>
      Travelar
    </Link>

    <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
    <p className="mt-2 text-sm text-white/70">{description}</p>

    <div className="mt-8 space-y-6">{children}</div>
  </div>
);

export default AuthCard;
