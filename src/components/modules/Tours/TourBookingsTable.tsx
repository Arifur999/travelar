"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiAddLine, RiHandCoinLine, RiRoadMapLine, RiWallet3Line } from "@remixicon/react";
import { toast } from "sonner";
import { deleteTourBookingAction } from "@/app/(dashboardLayout)/dashboard/tours/_action";
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
import { getTourBookings, getTours } from "@/services/tour.services";
import { TOUR_BOOKING_STATUS_OPTIONS } from "@/types/enums.types";
import { type DataTableFilterConfig } from "@/types/table.types";
import { type ITourBooking } from "@/types/tour.types";
import TourBookingDetailSheet from "./TourBookingDetailSheet";
import TourBookingFormModal from "./TourBookingFormModal";
import { tourBookingsColumns } from "./tourColumns";

const FILTER_DEFINITIONS = [
  serverManagedFilter.multi("status"),
  serverManagedFilter.single("packageId"),
];

interface TourBookingsTableProps {
  initialQueryString: string;
  isAdmin: boolean;
}

const TourBookingsTable = ({ initialQueryString, isAdmin }: TourBookingsTableProps) => {
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
  } = useRowActionModalState<ITourBooking>({ enableEdit: false, enableDelete: isAdmin });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["tour-bookings", effectiveQueryString],
    queryFn: () => getTourBookings(effectiveQueryString),
  });

  const { data: toursData } = useQuery({
    queryKey: ["tours"],
    queryFn: () => getTours("limit=200"),
  });

  const filterConfigs = useMemo<DataTableFilterConfig[]>(
    () => [
      {
        filterId: "status",
        label: "Status",
        type: "multi-select",
        options: TOUR_BOOKING_STATUS_OPTIONS,
      },
      {
        filterId: "packageId",
        label: "Tour",
        type: "single-select",
        options: (toursData?.data ?? []).map((tour) => ({ value: tour.id, label: tour.name })),
      },
    ],
    [toursData],
  );

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteTourBookingAction(id),
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
    void queryClient.invalidateQueries({ queryKey: ["tour-bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["tours"] });
    void queryClient.invalidateQueries({ queryKey: ["tour-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    void queryClient.refetchQueries({ queryKey: ["tour-bookings"], type: "active" });
    router.refresh();
  };

  const summary = data?.data.summary;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Billed"
          value={formatCurrency(summary?.totalRevenue ?? 0)}
          icon={RiRoadMapLine}
          accent="tour"
          hint="Live bookings only"
        />
        <StatsCard
          title="Profit"
          value={formatCurrency(summary?.totalProfit ?? 0)}
          icon={RiRoadMapLine}
          accent={summary && summary.totalProfit < 0 ? "destructive" : "success"}
          hint="Price less what the trips cost"
        />
        <StatsCard
          title="Collected"
          value={formatCurrency(summary?.totalPaid ?? 0)}
          icon={RiHandCoinLine}
          accent="success"
        />
        <StatsCard
          title="Outstanding"
          value={formatCurrency(summary?.totalDue ?? 0)}
          icon={RiWallet3Line}
          accent={summary && summary.totalDue > 0 ? "destructive" : "success"}
        />
      </div>

      <DataTable<ITourBooking>
        data={data?.data.bookings ?? []}
        columns={tourBookingsColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No bookings yet. Create a tour below, then sell seats on it."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search traveller, customer, tour",
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
            <RiAddLine className="size-4" aria-hidden="true" />
            New booking
          </Button>
        }
      />

      <TourBookingFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {/* "View" is where payments, the lifecycle and edits happen. */}
      {viewingItem && (
        <TourBookingDetailSheet
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
            <span className="font-medium text-foreground">{deletingItem?.leadTraveller}</span> on{" "}
            {deletingItem?.tourPackage.name}. The seats are freed and the customer stops being
            billed for it. To keep the record instead, cancel the booking rather than deleting
            it.
          </>
        }
      />
    </>
  );
};

export default TourBookingsTable;
