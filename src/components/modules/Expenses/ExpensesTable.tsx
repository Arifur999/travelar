"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus, Receipt, Tags } from "lucide-react";
import { toast } from "sonner";
import { deleteExpenseAction } from "@/app/(dashboardLayout)/dashboard/expenses/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StatsCard from "@/components/shared/StatsCard";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import {
  serverManagedFilter,
  useServerManagedDataTableFilters,
} from "@/hooks/useServerManagedDataTableFilters";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";
import { formatCurrency } from "@/lib/format";
import { getCashAccounts } from "@/services/account.services";
import { getExpenseCategories, getExpenseDashboard, getExpenses } from "@/services/expense.services";
import { type IExpense } from "@/types/expense.types";
import { type DataTableFilterConfig } from "@/types/table.types";
import ExpenseFormModal from "./ExpenseFormModal";
import { expensesColumns } from "./expensesColumns";

const FILTER_DEFINITIONS = [
  serverManagedFilter.single("categoryId"),
  serverManagedFilter.single("cashAccountId"),
  serverManagedFilter.range("amount"),
];

const ExpensesTable = ({ initialQueryString }: { initialQueryString: string }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    searchParams,
    queryStringFromUrl,
    optimisticSortingState,
    optimisticPaginationState,
    isRouteRefreshPending,
    updateParams,
    handleSortingChange,
    handlePaginationChange,
  } = useServerManagedDataTable();

  const { searchTermFromUrl, handleDebouncedSearchChange } = useServerManagedDataTableSearch({
    searchParams,
    updateParams,
  });

  const { filterValues, handleFilterChange, clearAllFilters } = useServerManagedDataTableFilters({
    searchParams,
    definitions: FILTER_DEFINITIONS,
    updateParams,
  });

  const {
    editingItem,
    deletingItem,
    isEditModalOpen,
    isDeleteDialogOpen,
    onEditOpenChange,
    onDeleteOpenChange,
    tableActions,
  } = useRowActionModalState<IExpense>({ enableView: false });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["expenses", effectiveQueryString],
    queryFn: () => getExpenses(effectiveQueryString),
  });

  // Month and year totals come from the dashboard, not from the page.
  const { data: dashboardData } = useQuery({
    queryKey: ["expense-dashboard"],
    queryFn: () => getExpenseDashboard(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: () => getExpenseCategories(),
  });

  const { data: accountsData } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
  });

  const filterConfigs = useMemo<DataTableFilterConfig[]>(
    () => [
      {
        filterId: "categoryId",
        label: "Category",
        type: "single-select",
        options: (categoriesData?.data ?? []).map((category) => ({
          value: category.id,
          label: category.name,
        })),
      },
      {
        filterId: "cashAccountId",
        label: "Account",
        type: "single-select",
        options: (accountsData?.data.data ?? []).map((account) => ({
          value: account.id,
          label: account.name,
        })),
      },
      {
        filterId: "amount",
        label: "Amount",
        type: "range",
        minPlaceholder: "Min",
        maxPlaceholder: "Max",
      },
    ],
    [categoriesData, accountsData],
  );

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteExpenseAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete expense");
      return;
    }

    toast.success(result.message || "Expense deleted");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    void queryClient.invalidateQueries({ queryKey: ["expense-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    void queryClient.refetchQueries({ queryKey: ["expenses"], type: "active" });
    router.refresh();
  };

  const dashboard = dashboardData?.data;

  return (
    <>
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

      <DataTable<IExpense>
        data={data?.data.expenses ?? []}
        columns={expensesColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No expenses yet."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search notes, category, account",
          onDebouncedChange: handleDebouncedSearchChange,
        }}
        sorting={{
          state: optimisticSortingState,
          onSortingChange: handleSortingChange,
        }}
        pagination={{
          state: optimisticPaginationState,
          onPaginationChange: handlePaginationChange,
        }}
        filters={{
          configs: filterConfigs,
          values: filterValues,
          onFilterChange: handleFilterChange,
          onClearAll: clearAllFilters,
        }}
        toolbarAction={
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Record expense
          </Button>
        }
      />

      <ExpenseFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {editingItem && (
        <ExpenseFormModal
          key={editingItem.id}
          open={isEditModalOpen}
          onOpenChange={onEditOpenChange}
          expense={editingItem}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this expense?"
        description={
          <>
            {deletingItem && (
              <>
                <span className="font-medium text-foreground">
                  {formatCurrency(deletingItem.amount)}
                </span>{" "}
                from {deletingItem.cashAccount.name}.{" "}
              </>
            )}
            The posting is reversed, so the account goes back up.
          </>
        }
      />
    </>
  );
};

export default ExpensesTable;
