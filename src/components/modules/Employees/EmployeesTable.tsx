"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteEmployeeAction } from "@/app/(dashboardLayout)/dashboard/employees/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";
import { getEmployees } from "@/services/employee.services";
import { type IEmployee } from "@/types/employee.types";
import EmployeeFormModal from "./EmployeeFormModal";
import { employeesColumns } from "./employeeColumns";

const EmployeesTable = ({ initialQueryString }: { initialQueryString: string }) => {
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

  const actions = useRowActionModalState<IEmployee>({ enableView: false });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["employees", effectiveQueryString],
    queryFn: () => getEmployees(effectiveQueryString),
  });

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteEmployeeAction(id),
  });

  const handleConfirmDelete = async () => {
    const item = actions.deletingItem;
    if (!item) return;

    const result = await runDelete(item.id);
    if (!result.success) {
      toast.error(result.message || "Failed to delete employee");
      return;
    }

    toast.success(result.message || "Employee deleted");
    actions.onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["employees"] });
    void queryClient.invalidateQueries({ queryKey: ["employee-dashboard"] });
    void queryClient.refetchQueries({ queryKey: ["employees"], type: "active" });
    router.refresh();
  };

  return (
    <>
      <DataTable<IEmployee>
        data={data?.data.employees ?? []}
        columns={employeesColumns}
        actions={actions.tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No employees yet."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search name, phone, address",
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
            Add employee
          </Button>
        }
      />

      <EmployeeFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      {actions.editingItem && (
        <EmployeeFormModal
          key={actions.editingItem.id}
          open={actions.isEditModalOpen}
          onOpenChange={actions.onEditOpenChange}
          employee={actions.editingItem}
        />
      )}

      <ConfirmDialog
        open={actions.isDeleteDialogOpen}
        onOpenChange={actions.onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this employee?"
        description={
          <>
            <span className="font-medium text-foreground">{actions.deletingItem?.name}</span> will
            be removed. The delete is refused while payouts still reference them — set a resign
            date instead to keep the history.
          </>
        }
      />
    </>
  );
};

export default EmployeesTable;
