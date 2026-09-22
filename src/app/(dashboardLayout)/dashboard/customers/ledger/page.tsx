import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import CustomerLedgerView from "@/components/modules/Customers/CustomerLedgerView";
import PageHeader from "@/components/shared/PageHeader";
import { getCustomerDashboard } from "@/services/customer.services";

export const metadata: Metadata = { title: "Customer ledger" };

const CustomerLedgerPage = async () => {
  const queryClient = new QueryClient();

  // The picker is the page, so it must not render empty on first paint.
  await queryClient.prefetchQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledger"
        description="One customer's account from the beginning: what they were billed, what they paid, and what is left."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <CustomerLedgerView />
      </HydrationBoundary>
    </div>
  );
};

export default CustomerLedgerPage;
