"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiAddLine } from "@remixicon/react";
import { toast } from "sonner";
import { deleteRouteAction } from "@/app/(dashboardLayout)/dashboard/routes/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";
import { getRoutes } from "@/services/masterData.services";
import { type IRoute } from "@/types/masterData.types";
import RouteFormModal from "./RouteFormModal";
import { routesColumns } from "./routesColumns";

const RoutesTable = ({ initialQueryString }: { initialQueryString: string }) => {
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
    editingItem,
    deletingItem,
    isEditModalOpen,
    isDeleteDialogOpen,
    onEditOpenChange,
    onDeleteOpenChange,
    tableActions,
  } = useRowActionModalState<IRoute>({ enableView: false });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["routes", effectiveQueryString],
    queryFn: () => getRoutes(effectiveQueryString),
  });

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteRouteAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete sector");
      return;
    }

    toast.success(result.message || "Sector deleted");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["routes"] });
    void queryClient.refetchQueries({ queryKey: ["routes"], type: "active" });
    router.refresh();
  };

  return (
    <>
      <DataTable<IRoute>
        data={data?.data ?? []}
        columns={routesColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No sectors yet. Add the routes you sell most often."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search sectors",
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
            Add sector
          </Button>
        }
      />

      <RouteFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {editingItem && (
        <RouteFormModal
          key={editingItem.id}
          open={isEditModalOpen}
          onOpenChange={onEditOpenChange}
          route={editingItem}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this sector?"
        description={
          <>
            <span className="font-mono font-medium text-foreground">{deletingItem?.name}</span>{" "}
            will be removed from the sector list. The delete is refused if any ticket still
            references it.
          </>
        }
      />
    </>
  );
};

export default RoutesTable;
