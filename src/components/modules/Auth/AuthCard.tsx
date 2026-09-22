import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * The form half of the signed-out card: wordmark, a headline you can read
 * across the room, then the form.
 *
 * The fields are repainted as soft pills — no visible border, no drawn label —
 * because that is the shape this page is cut to. Every override is scoped
 * here, so no other form in the app changes.
 *
 * Hiding the labels only works while every field carries a placeholder: the
 * label still exists for a screen reader, which a placeholder alone would not
 * provide. Anything added to these forms needs one.
 */
const AuthCard = ({ title, description, children }: AuthCardProps) => (
  <div
    className={cn(
      "w-full max-w-md",
      "[&_label]:sr-only",
      "[&_input]:h-12 [&_input]:rounded-full [&_input]:border-transparent [&_input]:bg-muted [&_input]:px-5 [&_input]:shadow-none",
      "[&_input]:focus-visible:border-transparent [&_input]:focus-visible:ring-primary/30",
      // The reveal toggle is absolutely placed over the right of the field;
      // without this the password runs underneath it.
      "[&_input:has(+span)]:pr-12",
      "[&_button[type=submit]]:h-12 [&_button[type=submit]]:rounded-full [&_button[type=submit]]:text-base",
    )}
  >
    <p className="text-center text-lg font-semibold tracking-tight text-primary">Travelar</p>

    <h1 className="mt-4 text-center text-4xl leading-tight font-bold tracking-tight text-balance">
      {title}
    </h1>

    {description && (
      <p className="mt-3 text-center text-sm text-balance text-muted-foreground">{description}</p>
    )}

    <div className="mt-8 space-y-5">{children}</div>

  </div>
);

export default AuthCard;
