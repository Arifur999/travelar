import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import SuppliersTable from "@/components/modules/Suppliers/SuppliersTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getSupplierDashboard, getSuppliers } from "@/services/supplier.services";

export const metadata: Metadata = { title: "Suppliers" };

const SuppliersPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["suppliers", queryString],
      queryFn: () => getSuppliers(queryString),
    }),
    // Whole-book totals for the headline cards, which must not be a sum of the
    // current page.
    queryClient.prefetchQuery({
      queryKey: ["supplier-dashboard"],
      queryFn: () => getSupplierDashboard(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Who you buy from, and what you owe them. Payable is derived as opening + purchases − payments, so a ticket's cost accrues the moment it is issued."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <SuppliersTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default SuppliersPage;
