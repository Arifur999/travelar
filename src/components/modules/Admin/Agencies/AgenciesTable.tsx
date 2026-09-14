"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteAgencyAction } from "@/app/(dashboardLayout)/admin/dashboard/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTable from "@/components/shared/table/DataTable";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import {
  serverManagedFilter,
  useServerManagedDataTableFilters,
} from "@/hooks/useServerManagedDataTableFilters";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";
import { getAdminPlans, getAgencies } from "@/services/admin.services";
import { type IAdminAgency } from "@/types/admin.types";
import { AGENCY_STATUS_LABELS, toSelectOptions } from "@/types/enums.types";
import { type DataTableFilterConfig } from "@/types/table.types";
import AgencyDetailSheet from "./AgencyDetailSheet";
import { agenciesColumns } from "./agenciesColumns";

/** Both ids are in the admin agency list's filterable whitelist. */
const FILTER_DEFINITIONS = [
  serverManagedFilter.multi("status"),
  serverManagedFilter.single("planId"),
];

const AgenciesTable = ({ initialQueryString }: { initialQueryString: string }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

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

  // "View" opens the management sheet; there is no separate edit form, since
  // an operator changes an agency through status, plan and trial actions.
  const {
    viewingItem,
    deletingItem,
    isViewDialogOpen,
    isDeleteDialogOpen,
    onViewOpenChange,
    onDeleteOpenChange,
    tableActions,
  } = useRowActionModalState<IAdminAgency>({ enableEdit: false });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["admin-agencies", effectiveQueryString],
    queryFn: () => getAgencies(effectiveQueryString),
  });

  const { data: plansData } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => getAdminPlans(),
  });

  const filterConfigs = useMemo<DataTableFilterConfig[]>(
    () => [
      {
        filterId: "status",
        label: "Status",
        type: "multi-select",
        options: toSelectOptions(AGENCY_STATUS_LABELS),
      },
      {
        filterId: "planId",
        label: "Plan",
        type: "single-select",
        options: (plansData?.data ?? []).map((plan) => ({ value: plan.id, label: plan.name })),
      },
    ],
    [plansData],
  );

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteAgencyAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete the agency");
      return;
    }

    toast.success(result.message || "Agency deleted");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
    void queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    void queryClient.invalidateQueries({ queryKey: ["activity-log"] });
    void queryClient.refetchQueries({ queryKey: ["admin-agencies"], type: "active" });
    router.refresh();
  };

  return (
    <>
      <DataTable<IAdminAgency>
        data={data?.data ?? []}
        columns={agenciesColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No agencies match."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search name, email, phone",
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
      />

      {viewingItem && (
        <AgencyDetailSheet
          key={viewingItem.id}
          open={isViewDialogOpen}
          onOpenChange={onViewOpenChange}
          agency={viewingItem}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this agency?"
        description={
          <>
            <span className="font-medium text-foreground">{deletingItem?.name}</span> is
            soft-deleted and suspended, and every one of its users is blocked — so the tenant
            genuinely stops working rather than carrying on behind a deleted flag. Its data is
            kept.
          </>
        }
      />
    </>
  );
};

export default AgenciesTable;
