import Link from "next/link";
import { Plane } from "lucide-react";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * The frosted panel every signed-out page sits in.
 *
 * It is glass rather than a solid card because the photograph behind it is the
 * point — but only just: the blur and the background tint are heavy enough
 * that the form keeps the contrast a form needs, whatever the photo is doing
 * underneath. `bg-background` rather than white, so the dark theme gets dark
 * glass instead of a bright slab.
 */
const AuthCard = ({ title, description, children }: AuthCardProps) => (
  <div className="w-full max-w-md rounded-2xl border border-white/25 bg-background/85 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 dark:border-white/10">
    <Link
      href="/"
      className="mb-6 flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Plane className="size-5" aria-hidden="true" />
      </span>
      Travelar
    </Link>

    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>

    <div className="mt-6 space-y-6">{children}</div>
  </div>
);

export default AuthCard;
