"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Banknote, Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { deleteSupplierPaymentAction } from "@/app/(dashboardLayout)/dashboard/suppliers/transactions/_action";
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
import { getCashAccounts } from "@/services/account.services";
import { getSupplierDashboard, getSupplierTransactions } from "@/services/supplier.services";
import { type ISupplierTransaction } from "@/types/supplier.types";
import { type DataTableFilterConfig } from "@/types/table.types";
import SupplierPaymentFormModal from "./SupplierPaymentFormModal";
import { supplierPaymentsColumns } from "./supplierPaymentsColumns";

/** Both ids and `amount` are in the module's filterable whitelist on the API. */
const FILTER_DEFINITIONS = [
  serverManagedFilter.single("supplierId"),
  serverManagedFilter.single("cashAccountId"),
  serverManagedFilter.range("amount"),
];

interface SupplierPaymentsTableProps {
  initialQueryString: string;
  /**
   * Reversing a posted payment is AGENCY_ADMIN only on the API. Passed from the
   * page rather than read here, so the menu item is simply absent for staff
   * instead of offering an action that would 403.
   */
  canDelete: boolean;
}

const SupplierPaymentsTable = ({
  initialQueryString,
  canDelete,
}: SupplierPaymentsTableProps) => {
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
    useRowActionModalState<ISupplierTransaction>({
      enableView: false,
      enableEdit: false,
      enableDelete: canDelete,
    });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["supplier-payments", effectiveQueryString],
    queryFn: () => getSupplierTransactions(effectiveQueryString),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: () => getSupplierDashboard(),
  });

  const { data: accountsData } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
  });

  const filterConfigs = useMemo<DataTableFilterConfig[]>(
    () => [
      {
        filterId: "supplierId",
        label: "Supplier",
        type: "single-select",
        options: (suppliersData?.data.data ?? []).map((supplier) => ({
          value: supplier.id,
          label: supplier.name,
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
    [suppliersData, accountsData],
  );

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteSupplierPaymentAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete payment");
      return;
    }

    toast.success(result.message || "Payment reversed");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
    void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    void queryClient.invalidateQueries({ queryKey: ["supplier-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["supplier-ledger"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    void queryClient.refetchQueries({ queryKey: ["supplier-payments"], type: "active" });
    router.refresh();
  };

  const summary = data?.data.summary;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatsCard
          title="Paid all time"
          value={formatCurrency(summary?.totalPaid ?? 0)}
          icon={Banknote}
          accent="success"
        />
        <StatsCard
          title="Payments recorded"
          value={formatNumber(summary?.totalCount ?? 0)}
          icon={Receipt}
          accent="primary"
        />
      </div>

      <DataTable<ISupplierTransaction>
        data={data?.data.transactions ?? []}
        columns={supplierPaymentsColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No supplier payments yet."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search notes, suppliers or accounts",
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
            Pay a supplier
          </Button>
        }
      />

      <SupplierPaymentFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Reverse this payment?"
        confirmLabel="Reverse"
        pendingLabel="Reversing..."
        description={
          <>
            {deletingItem && (
              <>
                <span className="font-medium text-foreground">
                  {formatCurrency(deletingItem.amount)}
                </span>{" "}
                to {deletingItem.supplier.name} from {deletingItem.cashAccount.name}.{" "}
              </>
            )}
            The posting is deleted, so {deletingItem?.cashAccount.name ?? "the account"} goes
            back up and the payable returns to what it was.
          </>
        }
      />
    </>
  );
};

export default SupplierPaymentsTable;
