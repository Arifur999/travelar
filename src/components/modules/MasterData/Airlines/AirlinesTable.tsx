"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiAddLine } from "@remixicon/react";
import { toast } from "sonner";
import { deleteAirlineAction } from "@/app/(dashboardLayout)/dashboard/airlines/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";
import { getAirlines } from "@/services/masterData.services";
import { type IAirline } from "@/types/masterData.types";
import AirlineFormModal from "./AirlineFormModal";
import { airlinesColumns } from "./airlinesColumns";

interface AirlinesTableProps {
  /**
   * The query string the Server Component prefetched with. It must be part of
   * the query key on both sides or the hydrated cache entry is never read and
   * the prefetch is wasted work.
   */
  initialQueryString: string;
}

const AirlinesTable = ({ initialQueryString }: AirlinesTableProps) => {
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
  } = useRowActionModalState<IAirline>({ enableView: false });

  // On first render queryStringFromUrl equals initialQueryString, so this hits
  // the hydrated cache instead of refetching what the server already sent.
  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["airlines", effectiveQueryString],
    queryFn: () => getAirlines(effectiveQueryString),
  });

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteAirlineAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      // The API refuses a delete while tickets reference the airline; that
      // message explains exactly why, so it is shown as-is.
      toast.error(result.message || "Failed to delete airline");
      return;
    }

    toast.success(result.message || "Airline deleted");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["airlines"] });
    void queryClient.refetchQueries({ queryKey: ["airlines"], type: "active" });
    router.refresh();
  };

  return (
    <>
      <DataTable<IAirline>
        data={data?.data ?? []}
        columns={airlinesColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No airlines yet. Add the ones you issue tickets on."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search airlines",
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
            Add airline
          </Button>
        }
      />

      <AirlineFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {/* Keyed by row id so switching rows remounts the form — useForm reads
          defaultValues once, so without this the second row opens showing the
          first row's values. */}
      {editingItem && (
        <AirlineFormModal
          key={editingItem.id}
          open={isEditModalOpen}
          onOpenChange={onEditOpenChange}
          airline={editingItem}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this airline?"
        description={
          <>
            <span className="font-medium text-foreground">{deletingItem?.name}</span> will be
            removed from the airline list. Tickets already issued on it keep their record, and
            the delete is refused if any still reference it.
          </>
        }
      />
    </>
  );
};

export default AirlinesTable;
