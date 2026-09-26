"use client";

import { useQuery } from "@tanstack/react-query";
import { RiGroupLine, RiHandCoinLine, RiReceiptLine, RiWallet3Line } from "@remixicon/react";
import StatsCard from "@/components/shared/StatsCard";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getCustomerDashboard } from "@/services/customer.services";

/** Whole-book totals, never a sum of whatever page a table happens to show. */
const CustomerSummaryCards = () => {
  const { data } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
  });

  const summary = data?.data.summary;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-5">
      <StatsCard
        title="Outstanding due"
        value={formatCurrency(summary?.totalCurrentDue ?? 0)}
        icon={RiWallet3Line}
        accent={summary && summary.totalCurrentDue > 0 ? "destructive" : "success"}
        hint="Opening + billed − collected − discount"
      />
      <StatsCard
        title="Billed all time"
        value={formatCurrency(summary?.totalPurchase ?? 0)}
        icon={RiReceiptLine}
        accent="primary"
        hint="Every sales module combined"
      />
      <StatsCard
        title="Collected all time"
        value={formatCurrency(summary?.totalCollections ?? 0)}
        icon={RiHandCoinLine}
        accent="success"
        hint={
          summary?.totalDiscount
            ? `${formatCurrency(summary.totalDiscount)} discounted`
            : undefined
        }
      />
      <StatsCard
        title="Customers"
        value={formatNumber(summary?.totalCustomers ?? 0)}
        icon={RiGroupLine}
        hint={
          summary?.totalOpeningDue
            ? `${formatCurrency(summary.totalOpeningDue)} carried in`
            : undefined
        }
      />
    </div>
  );
};

export default CustomerSummaryCards;
