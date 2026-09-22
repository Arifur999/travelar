import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import SupplierPayablesChart from "@/components/modules/Suppliers/SupplierPayablesChart";
import SupplierSummaryCards from "@/components/modules/Suppliers/SupplierSummaryCards";
import PageHeader from "@/components/shared/PageHeader";
import { getSupplierDashboard } from "@/services/supplier.services";

export const metadata: Metadata = { title: "Suppliers" };

/** The section's landing page: what is owed, and to whom. */
const SuppliersDashboardPage = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: () => getSupplierDashboard(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Who you buy from, and what you owe them. Payable is derived as opening + purchases − payments, so a ticket's cost accrues the moment it is issued."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <SupplierSummaryCards />
        <SupplierPayablesChart />
      </HydrationBoundary>
    </div>
  );
};

export default SuppliersDashboardPage;
