"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiAddLine } from "@remixicon/react";
import { toast } from "sonner";
import { deleteCustomerAction } from "@/app/(dashboardLayout)/dashboard/customers/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";

import { getCustomers } from "@/services/customer.services";
import { type ICustomer } from "@/types/customer.types";
import CustomerFormModal from "./CustomerFormModal";
import CustomerLedgerSheet from "./CustomerLedgerSheet";
import { customersColumns } from "./customersColumns";

const CustomersTable = ({ initialQueryString }: { initialQueryString: string }) => {
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
  } = useRowActionModalState<ICustomer>();

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["customers", effectiveQueryString],
    queryFn: () => getCustomers(effectiveQueryString),
  });

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteCustomerAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete customer");
      return;
    }

    toast.success(result.message || "Customer deleted");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
    void queryClient.refetchQueries({ queryKey: ["customers"], type: "active" });
    router.refresh();
  };

  return (
    <>
      <DataTable<ICustomer>
        data={data?.data ?? []}
        columns={customersColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No customers yet. Add one and every sale can be booked against them."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search name, phone, passport",
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
            <RiAddLine className="size-4" aria-hidden="true" />
            Add customer
          </Button>
        }
      />

      <CustomerFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {editingItem && (
        <CustomerFormModal
          key={editingItem.id}
          open={isEditModalOpen}
          onOpenChange={onEditOpenChange}
          customer={editingItem}
        />
      )}

      {viewingItem && (
        <CustomerLedgerSheet
          key={viewingItem.id}
          open={isViewDialogOpen}
          onOpenChange={onViewOpenChange}
          customer={viewingItem}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this customer?"
        description={
          <>
            <span className="font-medium text-foreground">{deletingItem?.name}</span> will be
            removed. The delete is refused while any ticket, visa case, Hajj booking or receipt
            still references them.
          </>
        }
      />
    </>
  );
};

export default CustomersTable;
