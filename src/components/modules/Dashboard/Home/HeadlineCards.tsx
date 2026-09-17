import { HandCoins, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import StatsCard from "@/components/shared/StatsCard";
import { monthOverMonth } from "@/lib/dashboardCharts";
import {
  calculateMarginPercent,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { type IDashboardSummary } from "@/types/dashboard.types";

/** "+12% vs last month so far" — the month is still running, so it says so. */
const changeHint = (change: number | null) => {
  if (change === null) return null;
  const sign = change > 0 ? "+" : "";
  return `${sign}${formatPercent(change, 0)} vs last month so far`;
};

/** The four numbers an owner looks for first. */
const HeadlineCards = ({ summary }: { summary: IDashboardSummary }) => {
  const { thisMonth, cashFlow, trend } = summary;
  const { byModule } = thisMonth;

  const salesCount = byModule.ticketing.count + byModule.visa.count + byModule.hajj.count;
  const margin = calculateMarginPercent(thisMonth.actualProfit, thisMonth.actualSales);
  const accountCount = cashFlow.accounts.length;

  const salesHint = [
    `${formatNumber(salesCount)} ${salesCount === 1 ? "sale" : "sales"}`,
    changeHint(monthOverMonth(trend, "sales")),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Cash in hand"
        value={formatCurrency(cashFlow.accountBalance, { whole: true })}
        icon={Wallet}
        accent={cashFlow.accountBalance < 0 ? "destructive" : "ledger"}
        hint={
          accountCount === 0
            ? "No cash accounts yet"
            : `Across ${accountCount} ${accountCount === 1 ? "account" : "accounts"}`
        }
      />

      <StatsCard
        title="Sales this month"
        value={formatCurrency(thisMonth.actualSales, { whole: true })}
        icon={TrendingUp}
        accent="primary"
        hint={salesHint}
      />

      <StatsCard
        title="Profit this month"
        value={formatCurrency(thisMonth.actualProfit, { whole: true })}
        icon={PiggyBank}
        accent={thisMonth.actualProfit < 0 ? "destructive" : "success"}
        // Margin is null without sales — "0.0%" would read as a measured zero.
        hint={margin === null ? "No sales yet this month" : `${formatPercent(margin)} margin`}
      />

      <StatsCard
        title="Customers owe you"
        value={formatCurrency(cashFlow.customerDue, { whole: true })}
        icon={HandCoins}
        accent="visa"
        hint={`You owe suppliers ${formatCurrency(cashFlow.supplierPayable, { whole: true })}`}
      />
    </div>
  );
};

export default HeadlineCards;
