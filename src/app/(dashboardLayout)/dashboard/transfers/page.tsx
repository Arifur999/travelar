import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import TransfersTable from "@/components/modules/Accounts/Transfers/TransfersTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getBalanceTransfers, getCashAccounts } from "@/services/account.services";

export const metadata: Metadata = { title: "Transfers" };

const TransfersPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["balance-transfers", queryString],
      queryFn: () => getBalanceTransfers(queryString),
    }),
    // The account filters need this on first paint, or the two dropdowns
    // render empty until a client fetch lands.
    queryClient.prefetchQuery({
      queryKey: ["cash-accounts"],
      queryFn: () => getCashAccounts(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transfers"
        description="Money moved between your own accounts. Each one writes a matching pair of postings, so the agency total never changes."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <TransfersTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default TransfersPage;
