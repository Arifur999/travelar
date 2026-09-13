"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { HandCoins, MoonStar, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { deleteHajjBookingAction } from "@/app/(dashboardLayout)/dashboard/hajj/_action";
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
import { getHajjBatches, getHajjBookings, getHajjPackages } from "@/services/hajj.services";
import { HAJJ_BOOKING_STATUS_OPTIONS } from "@/types/enums.types";
import { type DataTableFilterConfig } from "@/types/table.types";
import { type IHajjBooking } from "@/types/hajj.types";
import HajjBookingDetailSheet from "./HajjBookingDetailSheet";
import HajjBookingFormModal from "./HajjBookingFormModal";
import { hajjBookingsColumns } from "./hajjColumns";

const FILTER_DEFINITIONS = [
  serverManagedFilter.multi("status"),
  serverManagedFilter.single("packageId"),
  serverManagedFilter.single("batchId"),
];

interface HajjBookingsTableProps {
  initialQueryString: string;
  isAdmin: boolean;
}

const HajjBookingsTable = ({ initialQueryString, isAdmin }: HajjBookingsTableProps) => {
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
    deletingItem,
    isViewDialogOpen,
    isDeleteDialogOpen,
    onViewOpenChange,
    onDeleteOpenChange,
    tableActions,
  } = useRowActionModalState<IHajjBooking>({ enableEdit: false, enableDelete: isAdmin });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["hajj-bookings", effectiveQueryString],
    queryFn: () => getHajjBookings(effectiveQueryString),
  });

  const { data: packagesData } = useQuery({
    queryKey: ["hajj-packages"],
    queryFn: () => getHajjPackages("limit=200"),
  });

  const { data: batchesData } = useQuery({
    queryKey: ["hajj-batches"],
    queryFn: () => getHajjBatches("limit=200"),
  });

  const filterConfigs = useMemo<DataTableFilterConfig[]>(
    () => [
      {
        filterId: "status",
        label: "Status",
        type: "multi-select",
        options: HAJJ_BOOKING_STATUS_OPTIONS,
      },
      {
        filterId: "packageId",
        label: "Package",
        type: "single-select",
        options: (packagesData?.data ?? []).map((item) => ({
          value: item.id,
          label: item.name,
        })),
      },
      {
        filterId: "batchId",
        label: "Batch",
        type: "single-select",
        options: (batchesData?.data ?? []).map((batch) => ({
          value: batch.id,
          label: batch.name,
        })),
      },
    ],
    [packagesData, batchesData],
  );

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteHajjBookingAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete booking");
      return;
    }

    toast.success(result.message || "Booking deleted");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["hajj-bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["hajj-batches"] });
    void queryClient.invalidateQueries({ queryKey: ["hajj-batch-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    void queryClient.refetchQueries({ queryKey: ["hajj-bookings"], type: "active" });
    router.refresh();
  };

  const summary = data?.data.summary;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatsCard
          title="Billed"
          value={formatCurrency(summary?.totalRevenue ?? 0)}
          icon={MoonStar}
          accent="hajj"
          hint="Live bookings only"
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
        />
      </div>

      <DataTable<IHajjBooking>
        data={data?.data.bookings ?? []}
        columns={hajjBookingsColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No bookings yet. Create a package and a batch first."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search pilgrim, passport, customer",
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
            New booking
          </Button>
        }
      />

      <HajjBookingFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {/* "View" is where rooms, documents, payments and status moves happen. */}
      {viewingItem && (
        <HajjBookingDetailSheet
          key={viewingItem.id}
          open={isViewDialogOpen}
          onOpenChange={onViewOpenChange}
          booking={viewingItem}
          canDeletePayment={isAdmin}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this booking?"
        description={
          <>
            <span className="font-medium text-foreground">{deletingItem?.pilgrimName}</span> on{" "}
            {deletingItem?.batch.name}. The seat is freed and the customer stops being billed
            for it. To keep the record instead, cancel the booking rather than deleting it.
          </>
        }
      />
    </>
  );
};

export default HajjBookingsTable;
