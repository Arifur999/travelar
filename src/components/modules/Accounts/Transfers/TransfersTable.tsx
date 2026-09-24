"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiAddLine, RiArrowLeftRightLine } from "@remixicon/react";
import { toast } from "sonner";
import { deleteBalanceTransferAction } from "@/app/(dashboardLayout)/dashboard/transfers/_action";
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
import { formatCurrency, formatNumber } from "@/lib/format";
import { getBalanceTransfers, getCashAccounts } from "@/services/account.services";
import { type IBalanceTransfer } from "@/types/account.types";
import { type DataTableFilterConfig } from "@/types/table.types";
import TransferFormModal from "./TransferFormModal";
import { transfersColumns } from "./transfersColumns";

/**
 * `filterId` doubles as the backend field name, so these become
 * `?fromAccountId=<uuid>` and `?amount[gte]=...` with no translation. Both
 * fields are in the module's `balanceTransferFilterableFields` whitelist —
 * anything outside it is silently dropped by QueryBuilder.
 */
const FILTER_DEFINITIONS = [
  serverManagedFilter.single("fromAccountId"),
  serverManagedFilter.single("toAccountId"),
  serverManagedFilter.range("amount"),
];

const TransfersTable = ({ initialQueryString }: { initialQueryString: string }) => {
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
    deletingItem,
    isDeleteDialogOpen,
    onDeleteOpenChange,
    tableActions,
  } = useRowActionModalState<IBalanceTransfer>({ enableView: false, enableEdit: false });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["balance-transfers", effectiveQueryString],
    queryFn: () => getBalanceTransfers(effectiveQueryString),
  });

  // Accounts drive the two account filters. Shares the cache with the accounts
  // page, so this is usually free.
  const { data: accountsData } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
  });

  const filterConfigs = useMemo<DataTableFilterConfig[]>(() => {
    const options = (accountsData?.data.data ?? []).map((account) => ({
      value: account.id,
      label: account.name,
    }));

    return [
      { filterId: "fromAccountId", label: "From", type: "single-select", options },
      { filterId: "toAccountId", label: "To", type: "single-select", options },
      {
        filterId: "amount",
        label: "Amount",
        type: "range",
        minPlaceholder: "Min",
        maxPlaceholder: "Max",
      },
    ];
  }, [accountsData]);

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteBalanceTransferAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete transfer");
      return;
    }

    toast.success(result.message || "Transfer deleted");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["balance-transfers"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    void queryClient.refetchQueries({ queryKey: ["balance-transfers"], type: "active" });
    router.refresh();
  };

  const summary = data?.data.summary;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatsCard
          title="Transferred all time"
          value={formatCurrency(summary?.totalAmount ?? 0)}
          icon={RiArrowLeftRightLine}
          accent="ledger"
          hint="Nets to zero across your accounts — it never changes the total."
        />
        <StatsCard
          title="Transfers recorded"
          value={formatNumber(summary?.totalCount ?? 0)}
          icon={RiArrowLeftRightLine}
          accent="primary"
        />
      </div>

      <DataTable<IBalanceTransfer>
        data={data?.data.transfers ?? []}
        columns={transfersColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No transfers yet."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search notes or accounts",
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
            <RiAddLine className="size-4" aria-hidden="true" />
            New transfer
          </Button>
        }
      />

      <TransferFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this transfer?"
        description={
          <>
            {deletingItem && (
              <>
                <span className="font-medium text-foreground">
                  {formatCurrency(deletingItem.amount)}
                </span>{" "}
                from {deletingItem.fromAccount.name} to {deletingItem.toAccount.name}.{" "}
              </>
            )}
            Both postings are reversed, so the two balances return to exactly what they were
            before.
          </>
        }
      />
    </>
  );
};

export default TransfersTable;
