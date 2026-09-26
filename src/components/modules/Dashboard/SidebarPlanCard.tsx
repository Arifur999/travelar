"use client";

import Image from "next/image";
import Link from "next/link";
import { RiSparkling2Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { daysUntil, formatDate } from "@/lib/format";
import { type UserRole } from "@/types/enums.types";
import { type IMyFeatures } from "@/types/user.types";

interface SidebarPlanCardProps {
  myFeatures: IMyFeatures | null;
  role: UserRole;
  onNavigate: () => void;
}

/**
 * Where the agency stands on its plan, at the foot of the sidebar.
 *
 * It says the same thing as the banner on the dashboard, but that banner is
 * only on pages that render it and scrolls away with the page; this is in
 * view from every screen. The wording is kept in step with it deliberately —
 * reads keep working when a subscription lapses, only writes stop.
 *
 * Hidden when the rail is collapsed to icons, where there is no room for it.
 *
 * The aeroplane sits half out of the top: `-translate-y-1/2` puts exactly half
 * of it above the card's edge whatever the rail is scaled to, and the card's
 * top padding is the other half, so the heading never lands under a wing.
 */
const SidebarPlanCard = ({ myFeatures, role, onNavigate }: SidebarPlanCardProps) => {
  // The platform operator is not a tenant and has no plan to be on.
  if (!myFeatures || role === "SUPER_ADMIN") return null;

  const { status, isTrial, trialEndsAt, subscriptionEndsAt, planName } = myFeatures;

  const lapsed = status === "EXPIRED" || status === "SUSPENDED";
  const daysLeft = daysUntil(isTrial ? trialEndsAt : subscriptionEndsAt);

  const heading = lapsed
    ? status === "SUSPENDED"
      ? "Agency suspended"
      : "Subscription expired"
    : isTrial
      ? "Free trial"
      : (planName ?? "Your plan");

  const detail = lapsed
    ? "You can still read everything; changes are off."
    : daysLeft === null
      ? isTrial
        ? "Every module is unlocked."
        : "Active."
      : daysLeft <= 0
        ? "Ends today."
        : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left.`;

  // Staff cannot buy or renew anything, so they get the standing but not a
  // button that would only refuse them.
  const canAct = role === "AGENCY_ADMIN";

  return (
    // The overhanging half has to come out of somewhere: this margin is that
    // half, so the aeroplane leans into the gap under the nav rather than over
    // the last menu item.
    <div className="relative mt-16 group-data-[collapsible=icon]:hidden">
      <Image
        src="/airplane.png"
        alt=""
        aria-hidden="true"
        width={1536}
        height={1024}
        // The rail is about 240px wide; without this the browser is handed a
        // 1536px image to paint into it.
        sizes="256px"
        className="pointer-events-none absolute top-0 left-1/2 w-[88%] -translate-x-1/2 -translate-y-1/2 select-none drop-shadow-lg"
      />

      <div className="rounded-xl bg-sidebar-accent p-3 pt-[4.5rem]">
        <div className="flex items-center gap-2">
          <RiSparkling2Line className="size-4 shrink-0 text-sidebar-primary" aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-sidebar-accent-foreground">
            {heading}
          </p>
        </div>

        <p className="mt-1 text-xs text-sidebar-foreground/75">{detail}</p>

        {!lapsed && !isTrial && subscriptionEndsAt && (
          <p className="text-xs text-sidebar-foreground/60">
            Renews {formatDate(subscriptionEndsAt)}
          </p>
        )}

        {canAct && (
          <Button
            asChild
            size="sm"
            // secondary, not the default: the default carries the brand gradient
            // and its white bezel, and on the blue rail that is a blue button on
            // blue. Naming a flat variant also keeps the override deterministic
            // — layering a background colour over .bg-gradient-primary leaves
            // which one wins up to how tailwind-merge groups a custom class.
            variant="secondary"
            className="mt-3 w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          >
            <Link href="/dashboard/billing" onClick={onNavigate}>
              {lapsed ? "Renew now" : isTrial ? "Choose a plan" : "Manage plan"}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default SidebarPlanCard;
