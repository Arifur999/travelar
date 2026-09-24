"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiUserAddLine } from "@remixicon/react";
import { toast } from "sonner";
import { removeTeamMemberAction } from "@/app/(dashboardLayout)/dashboard/team/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import {
  serverManagedFilter,
  useServerManagedDataTableFilters,
} from "@/hooks/useServerManagedDataTableFilters";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";
import { getManageBlocker, type TeamViewer } from "@/lib/teamPermissions";
import { getTeamMembers } from "@/services/team.services";
import { TEAM_ROLE_OPTIONS, TEAM_STATUS_OPTIONS } from "@/types/enums.types";
import { type ITeamMember } from "@/types/team.types";
import { type DataTableFilterConfig } from "@/types/table.types";
import AddMemberFormModal from "./AddMemberFormModal";
import ManageMemberDialog from "./ManageMemberDialog";
import { buildTeamColumns } from "./teamColumns";

/** Both ids are in the API's teamFilterableFields whitelist. */
const FILTER_DEFINITIONS = [serverManagedFilter.single("role"), serverManagedFilter.single("status")];

const FILTER_CONFIGS: DataTableFilterConfig[] = [
  { filterId: "role", label: "Role", type: "single-select", options: TEAM_ROLE_OPTIONS },
  { filterId: "status", label: "Status", type: "single-select", options: TEAM_STATUS_OPTIONS },
];

interface TeamTableProps {
  initialQueryString: string;
  viewer: TeamViewer;
}

const TeamTable = ({ initialQueryString, viewer }: TeamTableProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const isAdmin = viewer.role === "AGENCY_ADMIN";

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

  // Staff get the list with no row actions at all — every change is admin-only
  // on the API, so offering the menu would only lead to a 403.
  const {
    editingItem,
    deletingItem,
    isEditModalOpen,
    isDeleteDialogOpen,
    onEditOpenChange,
    onDeleteOpenChange,
    tableActions,
  } = useRowActionModalState<ITeamMember>({
    enableView: false,
    enableEdit: isAdmin,
    enableDelete: isAdmin,
  });

  const columns = useMemo(() => buildTeamColumns(viewer.id), [viewer.id]);

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["team", effectiveQueryString],
    queryFn: () => getTeamMembers(effectiveQueryString),
  });

  const { mutateAsync: runRemove, isPending: isRemoving } = useMutation({
    mutationFn: (id: string) => removeTeamMemberAction(id),
  });

  const deleteBlocker = deletingItem ? getManageBlocker(viewer, deletingItem) : null;

  const handleConfirmRemove = async () => {
    if (!deletingItem || deleteBlocker) return;

    const result = await runRemove(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to remove the member");
      return;
    }

    toast.success(result.message || "Member removed");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["team"] });
    void queryClient.invalidateQueries({ queryKey: ["agency-profile"] });
    void queryClient.refetchQueries({ queryKey: ["team"], type: "active" });
    router.refresh();
  };

  return (
    <>
      <DataTable<ITeamMember>
        data={data?.data ?? []}
        columns={columns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No one matches."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search name or email",
          onDebouncedChange: handleDebouncedSearchChange,
        }}
        sorting={{ state: optimisticSortingState, onSortingChange: handleSortingChange }}
        pagination={{ state: optimisticPaginationState, onPaginationChange: handlePaginationChange }}
        filters={{
          configs: FILTER_CONFIGS,
          values: filterValues,
          onFilterChange: handleFilterChange,
          onClearAll: clearAllFilters,
        }}
        toolbarAction={
          isAdmin ? (
            <Button type="button" onClick={() => setIsAddOpen(true)}>
              <RiUserAddLine className="size-4" aria-hidden="true" />
              Add member
            </Button>
          ) : undefined
        }
      />

      {isAdmin && <AddMemberFormModal open={isAddOpen} onOpenChange={setIsAddOpen} viewer={viewer} />}

      {/* Keyed by id and updatedAt, so reopening after a save shows the saved
          values rather than the ones the form was first mounted with. */}
      {editingItem && (
        <ManageMemberDialog
          key={`${editingItem.id}-${editingItem.updatedAt}`}
          open={isEditModalOpen}
          onOpenChange={onEditOpenChange}
          member={editingItem}
          viewer={viewer}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={deleteBlocker ? () => onDeleteOpenChange(false) : handleConfirmRemove}
        isPending={isRemoving}
        destructive={!deleteBlocker}
        title={deleteBlocker ? "This member can't be removed" : `Remove ${deletingItem?.name}?`}
        confirmLabel={deleteBlocker ? "OK" : "Remove"}
        pendingLabel="Removing..."
        description={
          deleteBlocker ?? (
            <>
              <span className="font-medium text-foreground">{deletingItem?.email}</span> is signed
              out and can no longer sign in. Tickets, payments and history they recorded keep
              their name. The email stays reserved, so it cannot be reused for a new account.
            </>
          )
        }
      />
    </>
  );
};

export default TeamTable;
