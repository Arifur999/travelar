import type { Metadata } from "next";
import Link from "next/link";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import DashboardHome from "@/components/modules/Dashboard/Home/DashboardHome";
import { agencyNavGroups, isNavItemLocked, isNavItemVisibleToRole } from "@/lib/navItem";
import { cn } from "@/lib/utils";
import { getMyFeatures, getUserInfo } from "@/services/auth.services";
import { getDashboardSummary } from "@/services/dashboard.services";
import { PLAN_FEATURE_LABELS, type PlanFeature } from "@/types/enums.types";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * The agency's front page: the headline figures and charts first, then every
 * module as a compact link, with locked ones shown rather than hidden.
 *
 * The summary it draws is a base feature, so it renders on every plan.
 */
const DashboardPage = async () => {
  const queryClient = new QueryClient();

  const [userInfo, myFeatures] = await Promise.all([
    getUserInfo(),
    getMyFeatures(),
    // Same key as DashboardHome's useQuery. A failed prefetch is swallowed by
    // React Query; the client then retries and shows its own error state.
    queryClient.prefetchQuery({ queryKey: ["dashboard-summary"], queryFn: () => getDashboardSummary() }),
  ]);

  if (!userInfo) return null;

  const features = myFeatures?.features ?? [];

  // The landing page is the one place that should not link to itself.
  const links = agencyNavGroups
    .flatMap((group) => group.items)
    .filter((item) => isNavItemVisibleToRole(item, userInfo.role) && item.href !== "/dashboard");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome back, {userInfo.name.split(" ")[0]}
        </h2>
        <p className="text-sm text-muted-foreground">
          {userInfo.agency?.name ?? "Your workspace"} — here is how the business is doing.
        </p>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <DashboardHome canSetGoals={userInfo.role === "AGENCY_ADMIN"} />
      </HydrationBoundary>

      <section className="space-y-3" aria-labelledby="quick-access">
        <h3 id="quick-access" className="text-sm font-medium text-muted-foreground">
          Quick access
        </h3>

        <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
          {links.map((item) => {
            const Icon = item.icon;
            const locked = isNavItemLocked(item, features);
            const lockedReason = locked
              ? `${PLAN_FEATURE_LABELS[item.feature as PlanFeature]} is not in your plan — upgrade to unlock`
              : undefined;

            return (
              <li key={item.href}>
                <Link
                  href={locked ? "/dashboard/billing" : item.href}
                  title={lockedReason}
                  aria-label={locked ? `${item.title}: ${lockedReason}` : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors",
                    locked
                      ? "border-dashed text-muted-foreground hover:bg-muted/40"
                      : "hover:border-primary/40 hover:bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md",
                      locked ? "bg-muted" : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 leading-tight font-medium">{item.title}</span>
                  {locked && <Lock className="size-3.5 shrink-0" aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

export default DashboardPage;
