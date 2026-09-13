import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import CategoryBreakdown from "@/components/modules/Expenses/CategoryBreakdown";
import ExpensesTable from "@/components/modules/Expenses/ExpensesTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getCashAccounts } from "@/services/account.services";
import {
  getExpenseCategories,
  getExpenseDashboard,
  getExpenses,
} from "@/services/expense.services";

export const metadata: Metadata = { title: "Expenses" };

const ExpensesPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["expenses", queryString],
      queryFn: () => getExpenses(queryString),
    }),
    queryClient.prefetchQuery({
      queryKey: ["expense-dashboard"],
      queryFn: () => getExpenseDashboard(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["expense-categories"],
      queryFn: () => getExpenseCategories(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["cash-accounts"],
      queryFn: () => getCashAccounts(),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="What the agency spends. Each expense takes money out of an account and reports under a category, which is what makes budget tracking possible."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <ExpensesTable initialQueryString={queryString} />
        <CategoryBreakdown />
      </HydrationBoundary>
    </div>
  );
};

export default ExpensesPage;
