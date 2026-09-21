import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import ExpensesTable from "@/components/modules/Expenses/ExpensesTable";
import PageHeader from "@/components/shared/PageHeader";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getCashAccounts } from "@/services/account.services";
import { getExpenseCategories, getExpenses } from "@/services/expense.services";

export const metadata: Metadata = { title: "Expense transactions" };

const ExpenseTransactionsPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["expenses", queryString],
      queryFn: () => getExpenses(queryString),
    }),
    // Both feed the filters and the record-expense form, not the table itself.
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
        title="Expense transactions"
        description="Every expense recorded, newest first. Search, filter by category, account or amount, and record a new one."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <ExpensesTable initialQueryString={queryString} />
      </HydrationBoundary>
    </div>
  );
};

export default ExpenseTransactionsPage;
