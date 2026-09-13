import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import GoalsPanel from "@/components/modules/Reports/GoalsPanel";
import PageHeader from "@/components/shared/PageHeader";
import { getUserInfo } from "@/services/auth.services";
import { getGoals, getYearlyDashboard } from "@/services/dashboard.services";

export const metadata: Metadata = { title: "Goals" };

const GoalsPage = async () => {
  const year = new Date().getFullYear();

  const queryClient = new QueryClient();

  const [userInfo] = await Promise.all([
    getUserInfo(),
    queryClient.prefetchQuery({
      queryKey: ["goals", year],
      queryFn: () => getGoals(year),
    }),
    // Carries the actuals the goal table compares against. Note this one is a
    // REPORTS-gated endpoint while /goals itself is a base feature, so an
    // agency without REPORTS still sees its goals — just without the actuals
    // beside them.
    queryClient.prefetchQuery({
      queryKey: ["dashboard-yearly", year],
      queryFn: () => getYearlyDashboard(year),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Monthly sales and profit targets. Every dashboard measures against these, so a month with no goal reports no progress rather than zero progress."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <GoalsPanel canEdit={userInfo?.role === "AGENCY_ADMIN"} />
      </HydrationBoundary>
    </div>
  );
};

export default GoalsPage;
