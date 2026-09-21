import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import ReportsView from "@/components/modules/Reports/ReportsView";
import PageHeader from "@/components/shared/PageHeader";
import { getCashFlow, getMonthlyDashboard } from "@/services/dashboard.services";

export const metadata: Metadata = { title: "Reports" };

const ReportsPage = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const queryClient = new QueryClient();

  // Prefetch only what the default view needs — the monthly scope for the
  // current month, plus the cash position, which is period-independent. The
  // yearly and custom scopes load when their tab is opened.
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["dashboard-monthly", year, month],
      queryFn: () => getMonthlyDashboard(year, month),
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard-cash-flow"],
      queryFn: () => getCashFlow(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Sales, profit and spending at three scopes — plus what the money reconciles to right now."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <ReportsView />
      </HydrationBoundary>
    </div>
  );
};

export default ReportsPage;
