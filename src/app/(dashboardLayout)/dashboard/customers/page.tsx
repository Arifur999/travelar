import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import CustomerDuesChart from "@/components/modules/Customers/CustomerDuesChart";
import CustomerSummaryCards from "@/components/modules/Customers/CustomerSummaryCards";
import PageHeader from "@/components/shared/PageHeader";
import { getCustomerDashboard } from "@/services/customer.services";

export const metadata: Metadata = { title: "Customers" };

/** The section's landing page: what is owed, and by whom. */
const CustomersDashboardPage = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Who you sell to, and what they owe. The due balance sums every sales module together, less everything collected and discounted."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <CustomerSummaryCards />
        <CustomerDuesChart />
      </HydrationBoundary>
    </div>
  );
};

export default CustomersDashboardPage;
