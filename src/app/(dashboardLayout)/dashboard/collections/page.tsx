import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import CollectionsTable from "@/components/modules/Customers/Collections/CollectionsTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getCashAccounts } from "@/services/account.services";
import { getCustomerDashboard, getDueReceipts } from "@/services/customer.services";

export const metadata: Metadata = { title: "Collections" };

const CollectionsPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["collections", queryString],
      queryFn: () => getDueReceipts(queryString),
    }),
    queryClient.prefetchQuery({
      queryKey: ["customer-dashboard"],
      queryFn: () => getCustomerDashboard(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["cash-accounts"],
      queryFn: () => getCashAccounts(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description="Money received against a customer's balance. A receipt can split across two accounts, and a discount writes off part of the due without any money moving."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <CollectionsTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default CollectionsPage;
