"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Users, Wallet } from "lucide-react";
import StatsCard from "@/components/shared/StatsCard";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getWalletSummary } from "@/services/wallet.services";

/**
 * What the agency is holding, and where it came from.
 *
 * "Held" is a liability: this money belongs to customers until an invoice
 * consumes it. It is deliberately not phrased as income.
 */
const WalletSummaryCards = () => {
  const { data } = useQuery({
    queryKey: ["wallet-summary"],
    queryFn: () => getWalletSummary(),
  });

  const summary = data?.data;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Held for customers"
        value={formatCurrency(summary?.totalHeld ?? 0)}
        icon={Wallet}
        accent="success"
        hint="Paid in but not yet used against an invoice"
      />
      <StatsCard
        title="Customers in credit"
        value={formatNumber(summary?.customersInCredit ?? 0)}
        icon={Users}
        accent="primary"
      />
      <StatsCard
        title="Paid in"
        value={formatCurrency(summary?.paidIn ?? 0)}
        icon={ArrowDownLeft}
        accent="ledger"
        hint="Collections from these customers"
      />
      <StatsCard
        title="Used up"
        value={formatCurrency(summary?.usedUp ?? 0)}
        icon={ArrowUpRight}
        accent="expense"
        hint="Settled against tickets, visas and packages"
      />
    </div>
  );
};

export default WalletSummaryCards;
