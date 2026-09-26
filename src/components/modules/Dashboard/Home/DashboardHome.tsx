"use client";

import { useQuery } from "@tanstack/react-query";
import { RiRefreshLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardSummary } from "@/services/dashboard.services";
import { type PlanFeature } from "@/types/enums.types";
import CashByAccountChart from "./CashByAccountChart";
import HeadlineCards from "./HeadlineCards";
import NetPositionChart from "./NetPositionChart";
import SalesMixChart from "./SalesMixChart";
import SetupChecklist from "./SetupChecklist";
import TrendChart from "./TrendChart";

const HomeSkeleton = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading your figures">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-23 rounded-xl" />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Skeleton className="h-85 rounded-xl lg:col-span-2" />
      <Skeleton className="h-85 rounded-xl" />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-75 rounded-xl" />
      <Skeleton className="h-75 rounded-xl" />
    </div>
  </div>
);

/**
 * The figures on the landing page. A failure here is contained to this block:
 * the welcome and the module links around it still render and still work.
 */
const DashboardHome = ({ features }: { features: PlanFeature[] }) => {
  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    // Must match the prefetch in dashboard/page.tsx. It is a literal on both
    // sides on purpose: a constant exported from this "use client" file would
    // reach the Server Component as a client reference, not as the array.
    queryKey: ["dashboard-summary"],
    queryFn: () => getDashboardSummary(),
  });

  if (isPending) return <HomeSkeleton />;

  const summary = data?.data;

  if (isError || !summary) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">Your figures could not be loaded just now.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isRefetching}>
            <RiRefreshLine className={isRefetching ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { thisMonth, cashFlow, trend } = summary;

  return (
    <div className="space-y-4">
      <SetupChecklist setup={summary.setup} features={features} />

      <HeadlineCards summary={summary} />

      <TrendChart trend={trend} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SalesMixChart byModule={thisMonth.byModule} />
        <CashByAccountChart accounts={cashFlow.accounts} />
      </div>

      <NetPositionChart cashFlow={cashFlow} />
    </div>
  );
};

export default DashboardHome;
