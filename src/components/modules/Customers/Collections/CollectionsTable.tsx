"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiAddLine, RiCoupon3Line, RiHandCoinLine } from "@remixicon/react";
import { toast } from "sonner";
import { deleteDueReceiptAction } from "@/app/(dashboardLayout)/dashboard/collections/_action";
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
import { formatCurrency, formatNumber, toNumber } from "@/lib/format";
import { getCashAccounts } from "@/services/account.services";
import { getCustomerDashboard, getDueReceipts } from "@/services/customer.services";
import { type IDueReceived } from "@/types/customer.types";
import { type DataTableFilterConfig } from "@/types/table.types";
import CollectionFormModal from "./CollectionFormModal";
import { collectionsColumns } from "./collectionsColumns";

/**
 * Note there is no `amount` filter: a receipt has two amount columns, so there
 * is no single field to range over. The API's filterable whitelist reflects
 * that — customerId, cashAccount1Id, cashAccount2Id and date only.
 */
const FILTER_DEFINITIONS = [
  serverManagedFilter.single("customerId"),
  serverManagedFilter.single("cashAccount1Id"),
];

const CollectionsTable = ({ initialQueryString }: { initialQueryString: string }) => {
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

  const { deletingItem, isDeleteDialogOpen, onDeleteOpenChange, tableActions } =
    useRowActionModalState<IDueReceived>({ enableView: false, enableEdit: false });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["collections", effectiveQueryString],
    queryFn: () => getDueReceipts(effectiveQueryString),
  });

  const { data: customersData } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
  });

  const { data: accountsData } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
  });

  const filterConfigs = useMemo<DataTableFilterConfig[]>(
    () => [
      {
        filterId: "customerId",
        label: "Customer",
        type: "single-select",
        options: (customersData?.data.data ?? []).map((customer) => ({
          value: customer.id,
          label: customer.name,
        })),
      },
      {
        filterId: "cashAccount1Id",
        label: "Account",
        type: "single-select",
        options: (accountsData?.data.data ?? []).map((account) => ({
          value: account.id,
          label: account.name,
        })),
      },
    ],
    [customersData, accountsData],
  );

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteDueReceiptAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete collection");
      return;
    }

    toast.success(result.message || "Collection reversed");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["collections"] });
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    void queryClient.refetchQueries({ queryKey: ["collections"], type: "active" });
    router.refresh();
  };

  const summary = data?.data.summary;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatsCard
          title="Received all time"
          value={formatCurrency(summary?.totalReceived ?? 0)}
          icon={RiHandCoinLine}
          accent="success"
          hint="Both legs of every split tender"
        />
        <StatsCard
          title="Discounted"
          value={formatCurrency(summary?.totalDiscount ?? 0)}
          icon={RiCoupon3Line}
          hint="Written off, no money moved"
        />
        <StatsCard
          title="Receipts"
          value={formatNumber(summary?.totalCount ?? 0)}
          icon={RiHandCoinLine}
          accent="primary"
        />
      </div>

      <DataTable<IDueReceived>
        data={data?.data.receipts ?? []}
        columns={collectionsColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No collections yet."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search notes, customer, category",
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
            Receive money
          </Button>
        }
      />

      <CollectionFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Reverse this receipt?"
        confirmLabel="Reverse"
        pendingLabel="Reversing..."
        description={
          <>
            {deletingItem && (
              <>
                <span className="font-medium text-foreground">
                  {formatCurrency(
                    toNumber(deletingItem.amount1) + toNumber(deletingItem.amount2),
                  )}
                </span>{" "}
                from {deletingItem.customer.name}.{" "}
              </>
            )}
            Every posting it wrote is deleted — both legs of a split tender — so the accounts go
            back down and the due returns to what it was.
          </>
        }
      />
    </>
  );
};

export default CollectionsTable;
