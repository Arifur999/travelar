"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiAddLine, RiArrowUpCircleLine, RiPlaneLine, RiWallet3Line } from "@remixicon/react";
import { toast } from "sonner";
import { deleteTicketAction } from "@/app/(dashboardLayout)/dashboard/tickets/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import BreakdownDonut from "@/components/shared/chart/BreakdownDonut";
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
import { calculateMarginPercent, formatCurrency, formatPercent } from "@/lib/format";
import { getCustomerDashboard } from "@/services/customer.services";
import { getAirlines } from "@/services/masterData.services";
import { getTickets } from "@/services/ticket.services";
import { TICKET_STATUS_OPTIONS } from "@/types/enums.types";
import { type DataTableFilterConfig } from "@/types/table.types";
import { type ITicket } from "@/types/ticket.types";
import TicketDetailSheet from "./TicketDetailSheet";
import TicketFormModal from "./TicketFormModal";
import { ticketsColumns } from "./ticketsColumns";

/** Every id here is in the module's filterable whitelist on the API. */
const FILTER_DEFINITIONS = [
  serverManagedFilter.multi("status"),
  serverManagedFilter.single("customerId"),
  serverManagedFilter.single("airlineId"),
  serverManagedFilter.range("fare"),
];

interface TicketsTableProps {
  initialQueryString: string;
  /** Deleting a ticket or reversing a payment is AGENCY_ADMIN on the API. */
  isAdmin: boolean;
}

const TicketsTable = ({ initialQueryString, isAdmin }: TicketsTableProps) => {
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
  } = useRowActionModalState<ITicket>({ enableDelete: isAdmin });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["tickets", effectiveQueryString],
    queryFn: () => getTickets(effectiveQueryString),
  });

  const { data: customersData } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
  });

  const { data: airlinesData } = useQuery({
    queryKey: ["airlines", "limit=200"],
    queryFn: () => getAirlines("limit=200"),
  });

  const filterConfigs = useMemo<DataTableFilterConfig[]>(
    () => [
      { filterId: "status", label: "Status", type: "multi-select", options: TICKET_STATUS_OPTIONS },
      {
        filterId: "customerId",
        label: "Customer",
        type: "single-select",
        options: (customersData?.data.data ?? []).map((customer) => ({
          value: customer.id,
          label: customer.name,
        })),
      },
      {
        filterId: "airlineId",
        label: "Airline",
        type: "single-select",
        options: (airlinesData?.data ?? []).map((airline) => ({
          value: airline.id,
          label: `${airline.shortCode} — ${airline.name}`,
        })),
      },
      {
        filterId: "fare",
        label: "Fare",
        type: "range",
        minPlaceholder: "Min",
        maxPlaceholder: "Max",
      },
    ],
    [customersData, airlinesData],
  );

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteTicketAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete ticket");
      return;
    }

    toast.success(result.message || "Ticket deleted");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    void queryClient.invalidateQueries({ queryKey: ["supplier-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    void queryClient.refetchQueries({ queryKey: ["tickets"], type: "active" });
    router.refresh();
  };

  const summary = data?.data.summary;
  const margin = summary ? calculateMarginPercent(summary.totalProfit, summary.totalSales) : null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-5">
        <StatsCard
          title="Sales"
          value={formatCurrency(summary?.totalSales ?? 0)}
          icon={RiPlaneLine}
          accent="primary"
          hint="Fare + date change fees − refunds"
        />
        <StatsCard
          title="Profit"
          value={formatCurrency(summary?.totalProfit ?? 0)}
          icon={RiArrowUpCircleLine}
          accent={summary && summary.totalProfit < 0 ? "destructive" : "success"}
          // null rather than 0.0% when there are no sales — a measured zero and
          // "nothing sold yet" are different things.
          hint={margin === null ? "No sales yet" : `${formatPercent(margin)} margin`}
        />
        <StatsCard
          title="Collected"
          value={formatCurrency(summary?.totalPaid ?? 0)}
          icon={RiWallet3Line}
          accent="success"
        />
        <StatsCard
          title="Outstanding"
          value={formatCurrency(summary?.totalDue ?? 0)}
          icon={RiWallet3Line}
          accent={summary && summary.totalDue > 0 ? "destructive" : "success"}
          hint="Across every ticket, not this page"
        />
      </div>

      <BreakdownDonut
        title="Money on the counter"
        description="Of everything billed, how much has come in."
        slices={[
          { key: "collected", label: "Collected", value: summary?.totalPaid ?? 0, color: "var(--chart-1)" },
          {
            key: "outstanding",
            label: "Outstanding",
            value: summary?.totalDue ?? 0,
            color: "var(--destructive)",
          },
        ]}
        centreCaption="billed"
        emptyText="Nothing billed yet. Issue a ticket and this fills in."
      />

      <DataTable<ITicket>
        data={data?.data.tickets ?? []}
        columns={ticketsColumns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No tickets yet. Issue one to bill a customer and accrue the supplier cost."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search PNR, passenger, customer",
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
            Issue ticket
          </Button>
        }
      />

      <TicketFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {editingItem && (
        <TicketFormModal
          key={editingItem.id}
          open={isEditModalOpen}
          onOpenChange={onEditOpenChange}
          ticket={editingItem}
        />
      )}

      {/* "View" is where payments, date changes and status moves happen. */}
      {viewingItem && (
        <TicketDetailSheet
          key={viewingItem.id}
          open={isViewDialogOpen}
          onOpenChange={onViewOpenChange}
          ticket={viewingItem}
          canDeletePayment={isAdmin}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this ticket?"
        description={
          <>
            PNR{" "}
            <span className="font-mono font-medium text-foreground">{deletingItem?.pnr}</span>{" "}
            for {deletingItem?.passengerName}. The customer stops being billed for it and the
            supplier cost stops accruing, so both balances move.
          </>
        }
      />
    </>
  );
};

export default TicketsTable;
