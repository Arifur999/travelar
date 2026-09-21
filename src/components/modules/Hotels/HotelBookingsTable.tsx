"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BedDouble, HandCoins, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { deleteHotelBookingAction } from "@/app/(dashboardLayout)/dashboard/hotels/_action";
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
import { getHotelBookings } from "@/services/hotel.services";
import { HOTEL_BOOKING_STATUS_OPTIONS } from "@/types/enums.types";
import { type DataTableFilterConfig } from "@/types/table.types";
import { type IHotelBooking } from "@/types/hotel.types";
import HotelBookingDetailSheet from "./HotelBookingDetailSheet";
import HotelBookingFormModal from "./HotelBookingFormModal";
import { hotelBookingsColumns } from "./hotelColumns";

const FILTER_DEFINITIONS = [serverManagedFilter.multi("status")];

interface HotelBookingsTableProps {
  initialQueryString: string;
  isAdmin: boolean;
}

const HotelBookingsTable = ({ initialQueryString, isAdmin }: HotelBookingsTableProps) => {
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
  } = useRowActionModalState<IHotelBooking>({ enableEdit: false, enableDelete: isAdmin });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["hotel-bookings", effectiveQueryString],
    queryFn: () => getHotelBookings(effectiveQueryString),
  });

  const filterConfigs = useMemo<DataTableFilterConfig[]>(
    () => [
      {
        filterId: "status",
        label: "Status",
        type: "multi-select",
        options: HOTEL_BOOKING_STATUS_OPTIONS,
      },
    ],
    [],
  );

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteHotelBookingAction(id),
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
    void queryClient.invalidateQueries({ queryKey: ["hotel-bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["hotel-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    void queryClient.refetchQueries({ queryKey: ["hotel-bookings"], type: "active" });
    router.refresh();
  };

  const summary = data?.data.summary;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Billed"
          value={formatCurrency(summary?.totalRevenue ?? 0)}
          icon={BedDouble}
          accent="primary"
          hint="Live bookings only"
        />
        <StatsCard
          title="Profit"
          value={formatCurrency(summary?.totalProfit ?? 0)}
          icon={BedDouble}
          accent={summary && summary.totalProfit < 0 ? "destructive" : "success"}
          hint="Price less what the rooms cost"
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

      <DataTable<IHotelBooking>
        data={data?.data.bookings ?? []}
        columns={hotelBookingsColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No hotel bookings yet."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search guest, hotel, city, confirmation",
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

      <HotelBookingFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {/* "View" is where payments, the lifecycle and edits happen. */}
      {viewingItem && (
        <HotelBookingDetailSheet
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
            <span className="font-medium text-foreground">{deletingItem?.guestName}</span> at{" "}
            {deletingItem?.hotelName}. The customer stops being billed for it. To keep the record
            instead, cancel the booking rather than deleting it.
          </>
        }
      />
    </>
  );
};

export default HotelBookingsTable;
