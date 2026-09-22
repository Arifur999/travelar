import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import CustomersTable from "@/components/modules/Customers/CustomersTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getCustomers } from "@/services/customer.services";

export const metadata: Metadata = { title: "Clients list" };

const CustomersListPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["customers", queryString],
    queryFn: () => getCustomers(queryString),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients list"
        description="Everyone you sell to. Open a row to read the statement behind their balance."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <CustomersTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default CustomersListPage;
