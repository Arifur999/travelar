"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Receipt, Tags } from "lucide-react";
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Spent all time"
        value={formatCurrency(dashboard?.totalExpenses ?? 0)}
        icon={Receipt}
        accent="expense"
      />
      <StatsCard
        title="This month"
        value={formatCurrency(dashboard?.thisMonthTotal ?? 0)}
        icon={CalendarDays}
        accent="expense"
      />
      <StatsCard
        title="This year"
        value={formatCurrency(dashboard?.thisYearTotal ?? 0)}
        icon={CalendarDays}
        accent="ledger"
      />
      <StatsCard
        title="Biggest category"
        // null when nothing has been spent — "—" is honest, "0" would not be.
        value={dashboard?.topExpenseCategory?.name ?? "—"}
        icon={Tags}
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
