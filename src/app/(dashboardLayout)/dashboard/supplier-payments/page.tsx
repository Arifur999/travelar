import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import SupplierPaymentsTable from "@/components/modules/Suppliers/Payments/SupplierPaymentsTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getCashAccounts } from "@/services/account.services";
import { getUserInfo } from "@/services/auth.services";
import { getSupplierDashboard, getSupplierTransactions } from "@/services/supplier.services";

export const metadata: Metadata = { title: "Supplier payments" };

const SupplierPaymentsPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  const [userInfo] = await Promise.all([
    getUserInfo(),
    queryClient.prefetchQuery({
      queryKey: ["supplier-payments", queryString],
      queryFn: () => getSupplierTransactions(queryString),
    }),
    // Both feed the filter dropdowns and the payment form, so prefetching them
    // keeps the filters from rendering empty on first paint.
    queryClient.prefetchQuery({
      queryKey: ["supplier-dashboard"],
      queryFn: () => getSupplierDashboard(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["cash-accounts"],
      queryFn: () => getCashAccounts(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier payments"
        description="Money paid out to suppliers. Each payment posts against a cash account and reduces what you owe."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <SupplierPaymentsTable
          initialQueryString={queryString}
          canDelete={userInfo?.role === "AGENCY_ADMIN"}
        />
      </HydrationBoundary>
    </div>
  );
};

export default SupplierPaymentsPage;
