import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import CustomersTable from "@/components/modules/Customers/CustomersTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getCustomerDashboard, getCustomers } from "@/services/customer.services";

export const metadata: Metadata = { title: "Customers" };

const CustomersPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["customers", queryString],
      queryFn: () => getCustomers(queryString),
    }),
    queryClient.prefetchQuery({
      queryKey: ["customer-dashboard"],
      queryFn: () => getCustomerDashboard(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Who you sell to, and what they owe. The due balance sums tickets, visa cases and Hajj bookings together, less everything collected and discounted."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <CustomersTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default CustomersPage;
