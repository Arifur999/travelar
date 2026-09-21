import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import WalletBalancesChart from "@/components/modules/Wallet/WalletBalancesChart";
import WalletHoldersTable from "@/components/modules/Wallet/WalletHoldersTable";
import WalletSummaryCards from "@/components/modules/Wallet/WalletSummaryCards";
import PageHeader from "@/components/shared/PageHeader";
import { getWalletHolders, getWalletSummary } from "@/services/wallet.services";

export const metadata: Metadata = { title: "Wallet" };

/**
 * Advance deposits: money customers paid in before there was an invoice for it.
 *
 * Nothing is created here. A deposit is an ordinary collection, and it is spent
 * by choosing "from customer balance" when taking payment on a ticket, visa
 * case or Hajj booking — which is why this page only reads.
 */
const WalletPage = async () => {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ["wallet-summary"], queryFn: () => getWalletSummary() }),
    queryClient.prefetchQuery({ queryKey: ["wallet-holders"], queryFn: () => getWalletHolders() }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        description="What customers have paid in ahead of their invoices. The agency holds this money on their behalf until a sale uses it up."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <WalletSummaryCards />
        <WalletBalancesChart />
        <WalletHoldersTable />
      </HydrationBoundary>
    </div>
  );
};

export default WalletPage;
