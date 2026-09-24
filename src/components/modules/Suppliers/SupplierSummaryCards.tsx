"use client";

import { useQuery } from "@tanstack/react-query";
import { RiCashLine, RiShoppingCartLine, RiTruckLine, RiWallet3Line } from "@remixicon/react";
import StatsCard from "@/components/shared/StatsCard";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getSupplierDashboard } from "@/services/supplier.services";

/**
 * Whole-book totals from /suppliers/dashboard, never a sum of the current
 * page — the page holds ten rows, the headline has to cover every supplier.
 */
const SupplierSummaryCards = () => {
  const { data } = useQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: () => getSupplierDashboard(),
  });

  const summary = data?.data.summary;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Owed to suppliers"
        value={formatCurrency(summary?.totalCurrentPayable ?? 0)}
        icon={RiWallet3Line}
        accent={summary && summary.totalCurrentPayable > 0 ? "destructive" : "success"}
        hint="Opening + purchases − payments"
      />
      <StatsCard
        title="Purchased all time"
        value={formatCurrency(summary?.totalPurchase ?? 0)}
        icon={RiShoppingCartLine}
        accent="primary"
        hint="Ticket cost, date changes included"
      />
      <StatsCard
        title="Paid all time"
        value={formatCurrency(summary?.totalPaid ?? 0)}
        icon={RiCashLine}
        accent="success"
      />
      <StatsCard
        title="Suppliers"
        value={formatNumber(summary?.totalSuppliers ?? 0)}
        icon={RiTruckLine}
        accent="ledger"
        hint={
          summary?.totalOpeningPayable
            ? `${formatCurrency(summary.totalOpeningPayable)} carried in`
            : undefined
        }
      />
    </div>
  );
};

export default SupplierSummaryCards;
