"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Banknote, Plus, ShoppingCart, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { deleteSupplierAction } from "@/app/(dashboardLayout)/dashboard/suppliers/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StatsCard from "@/components/shared/StatsCard";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getSupplierDashboard, getSuppliers } from "@/services/supplier.services";
import { type ISupplier } from "@/types/supplier.types";
import SupplierFormModal from "./SupplierFormModal";
import SupplierLedgerSheet from "./SupplierLedgerSheet";
import { suppliersColumns } from "./suppliersColumns";

const SuppliersTable = ({ initialQueryString }: { initialQueryString: string }) => {
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

  const {
    viewingItem,
    editingItem,
    deletingItem,
    isViewDialogOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    onViewOpenChange,
    onEditOpenChange,
    onDeleteOpenChange,
    tableActions,
  } = useRowActionModalState<ISupplier>();

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["suppliers", effectiveQueryString],
    queryFn: () => getSuppliers(effectiveQueryString),
  });

  /**
   * Whole-book totals come from /suppliers/dashboard, not from summing the
   * page. The page holds ten rows; the headline has to cover every supplier,
   * and the old implementation got this wrong by reducing the current page.
   */
  const { data: dashboardData } = useQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: () => getSupplierDashboard(),
  });

  const summary = dashboardData?.data.summary;

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteSupplierAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete supplier");
      return;
    }

    toast.success(result.message || "Supplier deleted");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    void queryClient.invalidateQueries({ queryKey: ["supplier-dashboard"] });
    void queryClient.refetchQueries({ queryKey: ["suppliers"], type: "active" });
    router.refresh();
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Owed to suppliers"
          value={formatCurrency(summary?.totalCurrentPayable ?? 0)}
          icon={Wallet}
          accent={summary && summary.totalCurrentPayable > 0 ? "destructive" : "success"}
          hint="Opening + purchases − payments"
        />
        <StatsCard
          title="Purchased all time"
          value={formatCurrency(summary?.totalPurchase ?? 0)}
          icon={ShoppingCart}
          accent="primary"
          hint="Ticket cost, date changes included"
        />
        <StatsCard
          title="Paid all time"
          value={formatCurrency(summary?.totalPaid ?? 0)}
          icon={Banknote}
          accent="success"
        />
        <StatsCard
          title="Suppliers"
          value={formatNumber(summary?.totalSuppliers ?? 0)}
          icon={Truck}
          accent="ledger"
          hint={
            summary?.totalOpeningPayable
              ? `${formatCurrency(summary.totalOpeningPayable)} carried in`
              : undefined
          }
        />
      </div>

      <DataTable<ISupplier>
        data={data?.data ?? []}
        columns={suppliersColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No suppliers yet. Add the consolidators and agencies you buy from."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search suppliers",
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
        toolbarAction={
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add supplier
          </Button>
        }
      />

      <SupplierFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {editingItem && (
        <SupplierFormModal
          key={editingItem.id}
          open={isEditModalOpen}
          onOpenChange={onEditOpenChange}
          supplier={editingItem}
        />
      )}

      {/* "View" opens the statement — the only way to check a derived payable
          is to see the rows behind it. */}
      {viewingItem && (
        <SupplierLedgerSheet
          key={viewingItem.id}
          open={isViewDialogOpen}
          onOpenChange={onViewOpenChange}
          supplier={viewingItem}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this supplier?"
        description={
          <>
            <span className="font-medium text-foreground">{deletingItem?.name}</span> will be
            removed. The delete is refused while any ticket or payment still references them, so
            no history is orphaned.
          </>
        }
      />
    </>
  );
};

export default SuppliersTable;
