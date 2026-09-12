import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { daysUntil, formatDate } from "@/lib/format";
import { type UserRole } from "@/types/enums.types";
import { type IMyFeatures } from "@/types/user.types";

interface SubscriptionBannerProps {
  myFeatures: IMyFeatures | null;
  role: UserRole;
}

/**
 * Warns before the agency goes read-only, and says so plainly once it has.
 *
 * The wording matches what `requireActiveSubscription` actually does: reads
 * keep working, writes are refused. Saying "your account is locked" would be
 * wrong and would send people to support over data they can still see.
 */
const SubscriptionBanner = ({ myFeatures, role }: SubscriptionBannerProps) => {
  // The platform operator is not a tenant and is never gated.
  if (!myFeatures || role === "SUPER_ADMIN") return null;

  const { status, isTrial, trialEndsAt, subscriptionEndsAt, planName } = myFeatures;

  if (status === "EXPIRED" || status === "SUSPENDED") {
    const reason =
      status === "SUSPENDED"
        ? "This agency has been suspended."
        : "Your subscription has expired.";

    return (
      <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center">
        <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
        <p className="flex-1 text-sm">
          <span className="font-medium">{reason}</span>{" "}
          <span className="text-muted-foreground">
            You can still view everything, but changes are disabled until it is reactivated.
          </span>
        </p>
        {role === "AGENCY_ADMIN" && (
          <Button asChild size="sm">
            <Link href="/dashboard/billing">Renew now</Link>
          </Button>
        )}
      </div>
    );
  }

  if (isTrial) {
    const daysLeft = daysUntil(trialEndsAt);

    return (
      <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
        <Clock className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="flex-1 text-sm">
          <span className="font-medium">
            {daysLeft === null
              ? "You are on a free trial."
              : daysLeft <= 1
                ? "Your free trial ends today."
                : `${daysLeft} days left in your free trial.`}
          </span>{" "}
          <span className="text-muted-foreground">
            Every module is unlocked until {formatDate(trialEndsAt)}.
          </span>
        </p>
        {role === "AGENCY_ADMIN" && (
          <Button asChild size="sm" variant={daysLeft !== null && daysLeft <= 3 ? "default" : "outline"}>
            <Link href="/dashboard/billing">Choose a plan</Link>
          </Button>
        )}
      </div>
    );
  }

  // An active subscription only gets a banner in its final week — a permanent
  // one would train people to ignore the space it occupies.
  const daysLeft = daysUntil(subscriptionEndsAt);
  if (daysLeft === null || daysLeft > 7) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-expense/30 bg-expense/5 p-4 sm:flex-row sm:items-center">
      <Clock className="size-5 shrink-0 text-expense" aria-hidden="true" />
      <p className="flex-1 text-sm">
        <span className="font-medium">
          {daysLeft <= 1
            ? "Your subscription renews today."
            : `Your subscription ends in ${daysLeft} days.`}
        </span>{" "}
        <span className="text-muted-foreground">
          {planName ? `${planName} — ` : ""}expires {formatDate(subscriptionEndsAt)}.
        </span>
      </p>
      {role === "AGENCY_ADMIN" && (
        <Button asChild size="sm">
          <Link href="/dashboard/billing">Renew</Link>
        </Button>
      )}
    </div>
  );
};

export default SubscriptionBanner;
