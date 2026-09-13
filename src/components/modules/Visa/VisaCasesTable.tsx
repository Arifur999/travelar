"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FileCheck, HandCoins, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { deleteVisaCaseAction } from "@/app/(dashboardLayout)/dashboard/visa/_action";
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
import { formatCurrency } from "@/lib/format";
import { getCustomerDashboard } from "@/services/customer.services";
import { getVisaAgents, getVisaCases } from "@/services/visa.services";
import { VISA_STATUS_OPTIONS } from "@/types/enums.types";
import { type DataTableFilterConfig } from "@/types/table.types";
import { type IVisaCase } from "@/types/visa.types";
import VisaCaseDetailSheet from "./VisaCaseDetailSheet";
import VisaCaseFormModal from "./VisaCaseFormModal";
import { visaCasesColumns } from "./visaColumns";

/** Every id is in the module's filterable whitelist on the API. */
const FILTER_DEFINITIONS = [
  serverManagedFilter.multi("status"),
  serverManagedFilter.single("customerId"),
  serverManagedFilter.single("visaAgentId"),
];

interface VisaCasesTableProps {
  initialQueryString: string;
  isAdmin: boolean;
}

const VisaCasesTable = ({ initialQueryString, isAdmin }: VisaCasesTableProps) => {
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
  } = useRowActionModalState<IVisaCase>({ enableDelete: isAdmin });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["visa-cases", effectiveQueryString],
    queryFn: () => getVisaCases(effectiveQueryString),
  });

  const { data: customersData } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
  });

  const { data: agentsData } = useQuery({
    queryKey: ["visa-agents"],
    queryFn: () => getVisaAgents("limit=200"),
  });

  const filterConfigs = useMemo<DataTableFilterConfig[]>(
    () => [
      { filterId: "status", label: "Status", type: "multi-select", options: VISA_STATUS_OPTIONS },
      {
        filterId: "customerId",
        label: "Applicant",
        type: "single-select",
        options: (customersData?.data.data ?? []).map((customer) => ({
          value: customer.id,
          label: customer.name,
        })),
      },
      {
        filterId: "visaAgentId",
        label: "Agent",
        type: "single-select",
        options: (agentsData?.data ?? []).map((agent) => ({
          value: agent.id,
          label: agent.name,
        })),
      },
    ],
    [customersData, agentsData],
  );

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteVisaCaseAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete case");
      return;
    }

    toast.success(result.message || "Case deleted");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["visa-cases"] });
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    void queryClient.refetchQueries({ queryKey: ["visa-cases"], type: "active" });
    router.refresh();
  };

  const summary = data?.data.summary;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatsCard
          title="Billed"
          value={formatCurrency(summary?.totalRevenue ?? 0)}
          icon={FileCheck}
          accent="visa"
          hint="Service + embassy fees"
        />
        <StatsCard
          title="Collected"
          value={formatCurrency(summary?.totalPaid ?? 0)}
          icon={HandCoins}
          accent="success"
        />
        <StatsCard
          title="Outstanding"
          value={formatCurrency(summary?.totalDue ?? 0)}
          icon={Wallet}
          accent={summary && summary.totalDue > 0 ? "destructive" : "success"}
          hint="Across every case"
        />
      </div>

      <DataTable<IVisaCase>
        data={data?.data.cases ?? []}
        columns={visaCasesColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No visa cases yet."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search country, type, applicant",
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
            New case
          </Button>
        }
      />

      <VisaCaseFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {editingItem && (
        <VisaCaseFormModal
          key={editingItem.id}
          open={isEditModalOpen}
          onOpenChange={onEditOpenChange}
          visaCase={editingItem}
        />
      )}

      {/* "View" is where documents, payments and status moves happen. */}
      {viewingItem && (
        <VisaCaseDetailSheet
          key={viewingItem.id}
          open={isViewDialogOpen}
          onOpenChange={onViewOpenChange}
          visaCase={viewingItem}
          canDeletePayment={isAdmin}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this case?"
        description={
          <>
            The {deletingItem?.country} {deletingItem?.visaType} case for{" "}
            <span className="font-medium text-foreground">
              {deletingItem?.customer.name}
            </span>
            . The applicant stops being billed for it, so their due moves.
          </>
        }
      />
    </>
  );
};

export default VisaCasesTable;
