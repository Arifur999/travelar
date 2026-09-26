"use client";

import { useQuery } from "@tanstack/react-query";
import { RiCalendar2Line, RiPriceTag3Line, RiReceiptLine } from "@remixicon/react";
import StatsCard from "@/components/shared/StatsCard";
import { formatCurrency } from "@/lib/format";
import { getExpenseDashboard } from "@/services/expense.services";

/** The four headline figures, shared by the Expenses dashboard. */
const ExpenseSummaryCards = () => {
  const { data } = useQuery({
    queryKey: ["expense-dashboard"],
    queryFn: () => getExpenseDashboard(),
  });

  const dashboard = data?.data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-5">
      <StatsCard
        title="Spent all time"
        value={formatCurrency(dashboard?.totalExpenses ?? 0)}
        icon={RiReceiptLine}
      />
      <StatsCard
        title="This month"
        value={formatCurrency(dashboard?.thisMonthTotal ?? 0)}
        icon={RiCalendar2Line}
      />
      <StatsCard
        title="This year"
        value={formatCurrency(dashboard?.thisYearTotal ?? 0)}
        icon={RiCalendar2Line}
      />
      <StatsCard
        title="Biggest category"
        // null when nothing has been spent — "—" is honest, "0" would not be.
        value={dashboard?.topExpenseCategory?.name ?? "—"}
        icon={RiPriceTag3Line}
        accent="primary"
        hint={
          dashboard?.topExpenseCategory
            ? formatCurrency(dashboard.topExpenseCategory.total)
            : "Nothing spent yet"
        }
      />
    </div>
  );
};

export default ExpenseSummaryCards;
