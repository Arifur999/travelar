import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { platformNavGroups } from "@/lib/navItem";
import { getUserInfo } from "@/services/auth.services";

export const metadata: Metadata = { title: "Platform console" };

/**
 * The operator landing page. Platform metrics (MRR, churn, active tenants)
 * arrive with the admin feature slice; this shows no numbers rather than
 * inventing them.
 */
const AdminDashboardPage = async () => {
  const userInfo = await getUserInfo();
  if (!userInfo) return null;

  const items = platformNavGroups
    .flatMap((group) => group.items)
    .filter((item) => item.href !== "/admin/dashboard");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Platform console</h2>
        <p className="text-sm text-muted-foreground">
          Manage tenants, plans and support across every agency.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.href} className="transition-colors hover:border-primary/40">
              <Link href={item.href} className="block">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <CardDescription className="text-xs">{item.href}</CardDescription>
                  </div>
                </CardHeader>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
