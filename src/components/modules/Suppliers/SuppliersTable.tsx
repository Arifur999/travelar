"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteSupplierAction } from "@/app/(dashboardLayout)/dashboard/suppliers/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";

import { getSuppliers } from "@/services/supplier.services";
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
