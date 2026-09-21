import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import DashboardHome from "@/components/modules/Dashboard/Home/DashboardHome";
import { getMyFeatures, getUserInfo } from "@/services/auth.services";
import { getDashboardSummary } from "@/services/dashboard.services";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * The agency's front page: the headline figures and the charts behind them.
 * Getting to a module is the sidebar's job, so there is no link grid here.
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
    queryClient.prefetchQuery({
      queryKey: ["dashboard-summary"],
      queryFn: () => getDashboardSummary(),
    }),
  ]);

  if (!userInfo) return null;

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
        <DashboardHome features={myFeatures?.features ?? []} />
      </HydrationBoundary>
    </div>
  );
};

export default DashboardPage;
