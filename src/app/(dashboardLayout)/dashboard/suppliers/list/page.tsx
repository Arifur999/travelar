import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import SuppliersTable from "@/components/modules/Suppliers/SuppliersTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getSuppliers } from "@/services/supplier.services";

export const metadata: Metadata = { title: "Supplier list" };

const SupplierListPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["suppliers", queryString],
    queryFn: () => getSuppliers(queryString),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier list"
        description="Who you buy from. Open a row to read the statement behind their payable."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <SuppliersTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default SupplierListPage;
