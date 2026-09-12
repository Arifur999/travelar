import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import BalanceDashboard from "@/components/modules/Accounts/BalanceDashboard/BalanceDashboard";
import CashAccountsTable from "@/components/modules/Accounts/CashAccounts/CashAccountsTable";
import PageHeader from "@/components/shared/PageHeader";
import { getAccountsOverview, getCashAccounts } from "@/services/account.services";

export const metadata: Metadata = { title: "Cash accounts" };

const AccountsPage = async () => {
  const queryClient = new QueryClient();

  // Both in parallel — they read the same ledger, and waiting for one then the
  // other would double the page's time to first byte for no reason.
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["cash-accounts"],
      queryFn: () => getCashAccounts(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["accounts-overview"],
      queryFn: () => getAccountsOverview(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash accounts"
        description="Where your money sits. Each balance is the sum of that account's postings — there is no stored balance that could drift from the ledger."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <CashAccountsTable />
        <BalanceDashboard />
      </HydrationBoundary>
    </div>
  );
};

export default AccountsPage;
