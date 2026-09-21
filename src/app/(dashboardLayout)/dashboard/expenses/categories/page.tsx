import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import CategoryBreakdown from "@/components/modules/Expenses/CategoryBreakdown";
import PageHeader from "@/components/shared/PageHeader";
import { getExpenseCategories, getExpenseDashboard } from "@/services/expense.services";

export const metadata: Metadata = { title: "Expense categories" };

const ExpenseCategoriesPage = async () => {
  const queryClient = new QueryClient();

  await Promise.all([
    // The breakdown carries the spend and the budget use; the list behind it is
    // what the edit form populates from.
    queryClient.prefetchQuery({
      queryKey: ["expense-dashboard"],
      queryFn: () => getExpenseDashboard(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["expense-categories"],
      queryFn: () => getExpenseCategories(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense categories"
        description="What an expense can be reported under, with this month's spend against each budget. Every expense needs one."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <CategoryBreakdown />
      </HydrationBoundary>
    </div>
  );
};

export default ExpenseCategoriesPage;
