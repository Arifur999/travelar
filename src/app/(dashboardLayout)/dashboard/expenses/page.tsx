import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import ExpenseCategoryChart from "@/components/modules/Expenses/ExpenseCategoryChart";
import ExpenseSummaryCards from "@/components/modules/Expenses/ExpenseSummaryCards";
import ExpenseTrendChart from "@/components/modules/Expenses/ExpenseTrendChart";
import PageHeader from "@/components/shared/PageHeader";
import { getDashboardSummary } from "@/services/dashboard.services";
import { getExpenseDashboard } from "@/services/expense.services";

export const metadata: Metadata = { title: "Expenses" };

/** The section's landing page: the totals, and what they were spent on. */
const ExpensesDashboardPage = async () => {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["expense-dashboard"],
      queryFn: () => getExpenseDashboard(),
    }),
    // The month-by-month figures live on the landing summary, which every plan
    // can read — unlike the Reports module.
    queryClient.prefetchQuery({
      queryKey: ["dashboard-summary"],
      queryFn: () => getDashboardSummary(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="What the agency spends. Each expense takes money out of an account and reports under a category, which is what makes budget tracking possible."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <ExpenseSummaryCards />
        <ExpenseTrendChart />
        <ExpenseCategoryChart />
      </HydrationBoundary>
    </div>
  );
};

export default ExpensesDashboardPage;
