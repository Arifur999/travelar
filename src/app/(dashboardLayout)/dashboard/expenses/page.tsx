import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import ExpenseSummaryCards from "@/components/modules/Expenses/ExpenseSummaryCards";
import ExpenseTopCategories from "@/components/modules/Expenses/ExpenseTopCategories";
import PageHeader from "@/components/shared/PageHeader";
import { getExpenseDashboard } from "@/services/expense.services";

export const metadata: Metadata = { title: "Expenses" };

/** The section's landing page: the totals, and what they were spent on. */
const ExpensesDashboardPage = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["expense-dashboard"],
    queryFn: () => getExpenseDashboard(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="What the agency spends. Each expense takes money out of an account and reports under a category, which is what makes budget tracking possible."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <ExpenseSummaryCards />
        <ExpenseTopCategories />
      </HydrationBoundary>
    </div>
  );
};

export default ExpensesDashboardPage;
