"use client";

import { useQuery } from "@tanstack/react-query";
import DateCell from "@/components/shared/cell/DateCell";
import PersonCell from "@/components/shared/cell/PersonCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import DataTable from "@/components/shared/table/DataTable";
import { Badge } from "@/components/ui/badge";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import {
  serverManagedFilter,
  useServerManagedDataTableFilters,
} from "@/hooks/useServerManagedDataTableFilters";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";
import { formatCurrency, formatNumber, truncate } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import { getActivityLog } from "@/services/admin.services";
import { type IActivityLogEntry } from "@/types/admin.types";
import { AGENCY_STATUS_LABELS, type AgencyStatus, type BadgeTone } from "@/types/enums.types";
import { type DataTableFilterConfig } from "@/types/table.types";

/**
 * The actions the API writes today (`logActivity` in admin.service.ts). The
 * column is free text on the backend, so an action not listed here still
 * renders — humanized — rather than disappearing.
 */
const ACTION_LABELS: Record<string, { label: string; tone: BadgeTone }> = {
  plan_created: { label: "Plan created", tone: "success" },
  plan_updated: { label: "Plan updated", tone: "info" },
  plan_deactivated: { label: "Plan withdrawn", tone: "warning" },
  agency_status_changed: { label: "Status changed", tone: "info" },
  plan_assigned: { label: "Plan assigned", tone: "success" },
  trial_extended: { label: "Trial extended", tone: "info" },
  agency_deleted: { label: "Agency deleted", tone: "danger" },
};

const humanize = (value: string) =>
  value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word, index) => (index === 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");

const statusLabel = (value: unknown) =>
  typeof value === "string" && value in AGENCY_STATUS_LABELS
    ? AGENCY_STATUS_LABELS[value as AgencyStatus]
    : String(value ?? "—");

/** One readable line out of the JSON `details` each action writes. */
const describeDetails = (entry: IActivityLogEntry): string => {
  const details = entry.details ?? {};

  switch (entry.action) {
    case "plan_created":
      return `${String(details.name ?? "Plan")} at ${formatCurrency(details.price)}`;
    case "plan_updated":
    case "plan_deactivated":
    case "agency_deleted":
      return String(details.name ?? "—");
    case "agency_status_changed":
      return `${statusLabel(details.from)} → ${statusLabel(details.to)}`;
    case "plan_assigned":
      return `${String(details.planName ?? "Plan")}${
        typeof details.action === "string" ? ` (${humanize(details.action)})` : ""
      }`;
    case "trial_extended":
      return `+${formatNumber(details.days)} days`;
    default: {
      const text = JSON.stringify(details);
      return text === "{}" ? "—" : truncate(text, 80);
    }
  }
};

const FILTER_DEFINITIONS = [
  serverManagedFilter.single("action"),
  serverManagedFilter.single("targetType"),
];

const FILTER_CONFIGS: DataTableFilterConfig[] = [
  {
    filterId: "action",
    label: "Action",
    type: "single-select",
    options: Object.entries(ACTION_LABELS).map(([value, { label }]) => ({ value, label })),
  },
  {
    filterId: "targetType",
    label: "Target",
    type: "single-select",
    options: [
      { value: "Agency", label: "Agency" },
      { value: "Plan", label: "Plan" },
    ],
  },
];

const columns: AppColumnDef<IActivityLogEntry>[] = [
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "When",
    cell: ({ row }) => <DateCell date={row.original.createdAt} withTime />,
  },
  {
    id: "admin",
    header: "Operator",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.admin ? (
        <PersonCell
          name={row.original.admin.name}
          secondary={row.original.admin.email}
          showAvatar={false}
        />
      ) : (
        <span className="text-xs text-muted-foreground">Removed user</span>
      ),
  },
  {
    id: "action",
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const known = ACTION_LABELS[row.original.action];
      return (
        <StatusBadge
          label={known?.label ?? humanize(row.original.action)}
          tone={known?.tone ?? "neutral"}
        />
      );
    },
  },
  {
    // The column id is what reaches the API as sortBy, so it must be a real field.
    id: "targetType",
    accessorKey: "targetType",
    header: "Target",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Badge variant="outline">{row.original.targetType}</Badge>
        {row.original.targetId && (
          <span className="font-mono text-xs text-muted-foreground" title={row.original.targetId}>
            {row.original.targetId.slice(0, 8)}
          </span>
        )}
      </div>
    ),
  },
  {
    id: "details",
    header: "Details",
    enableSorting: false,
    cell: ({ row }) => <span className="text-sm">{describeDetails(row.original)}</span>,
  },
];

/** Read-only: the log is append-only on the API, so there are no row actions. */
const ActivityLogTable = ({ initialQueryString }: { initialQueryString: string }) => {
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

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["activity-log", effectiveQueryString],
    queryFn: () => getActivityLog(effectiveQueryString),
  });

  return (
    <DataTable<IActivityLogEntry>
      data={data?.data ?? []}
      columns={columns}
      meta={data?.meta}
      isLoading={isFetching || isRouteRefreshPending}
      emptyMessage="Nothing logged yet."
      search={{
        initialValue: searchTermFromUrl,
        placeholder: "Search action or target",
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
    />
  );
};

export default ActivityLogTable;
