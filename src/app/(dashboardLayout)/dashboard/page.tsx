import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agencyNavGroups, isNavItemLocked, isNavItemVisibleToRole } from "@/lib/navItem";
import { getMyFeatures, getUserInfo } from "@/services/auth.services";
import { PLAN_FEATURE_LABELS, type PlanFeature } from "@/types/enums.types";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * The shell landing page: every module the agency can reach, with the locked
 * ones shown rather than hidden.
 *
 * The financial summary (revenue, profit, dues, balances) lands here in the
 * dashboard feature slice — this page deliberately shows no numbers yet rather
 * than inventing placeholder ones.
 */
const DashboardPage = async () => {
  const [userInfo, myFeatures] = await Promise.all([getUserInfo(), getMyFeatures()]);

  if (!userInfo) return null;

  const features = myFeatures?.features ?? [];

  // The landing page is the one place that should not link to itself.
  const groups = agencyNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => isNavItemVisibleToRole(item, userInfo.role) && item.href !== "/dashboard",
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome back, {userInfo.name.split(" ")[0]}
        </h2>
        <p className="text-sm text-muted-foreground">
          {userInfo.agency?.name ?? "Your workspace"} — pick a module to get started.
        </p>
      </div>

      {groups.map((group) => (
        <section key={group.label} className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">{group.label}</h3>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.items.map((item) => {
              const Icon = item.icon;
              const locked = isNavItemLocked(item, features);

              return (
                <Card
                  key={item.href}
                  className={locked ? "border-dashed bg-muted/30" : "transition-colors hover:border-primary/40"}
                >
                  <Link href={locked ? "/dashboard/billing" : item.href} className="block">
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                      <span
                        className={
                          locked
                            ? "flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                            : "flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
                        }
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <CardTitle className="flex-1 text-sm font-medium">{item.title}</CardTitle>
                      {locked && (
                        <Lock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      )}
                    </CardHeader>

                    {locked && (
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground">
                          {PLAN_FEATURE_LABELS[item.feature as PlanFeature]} is not in your plan —
                          upgrade to unlock.
                        </p>
                      </CardContent>
                    )}
                  </Link>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default DashboardPage;
