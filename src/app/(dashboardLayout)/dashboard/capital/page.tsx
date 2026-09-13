import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import CapitalPanel from "@/components/modules/Capital/CapitalPanel";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getCashAccounts } from "@/services/account.services";
import {
  getCapitalFlows,
  getCapitalSummary,
  getProfitWithdrawals,
} from "@/services/capital.services";

export const metadata: Metadata = { title: "Capital" };

const CapitalPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  // Every capital route is AGENCY_ADMIN on the API, and the nav entry is
  // restricted to that role — a staff member never reaches this page, and if
  // they did these prefetches would fail with a 403 rather than leaking data.
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["capital-flows", queryString],
      queryFn: () => getCapitalFlows(queryString),
    }),
    queryClient.prefetchQuery({
      queryKey: ["profit-withdrawals", "page=1&limit=10"],
      queryFn: () => getProfitWithdrawals("page=1&limit=10"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["capital-summary"],
      queryFn: () => getCapitalSummary(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["cash-accounts"],
      queryFn: () => getCashAccounts(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capital"
        description="Owner money in and out, kept separate from profit taken out — only a capital withdrawal reduces the stake."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <CapitalPanel initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default CapitalPage;
