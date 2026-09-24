"use client";

import { useMemo } from "react";
import {
  useTable,
  type PaginationState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { RiArrowDownLine, RiArrowUpLine, RiExpandUpDownLine, RiMoreLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { appTableFeatures, type AppColumnDef } from "@/lib/table/features";
import { cn } from "@/lib/utils";
import { type PaginationMeta } from "@/types/api.types";
import {
  type DataTableFilterConfig,
  type DataTableFilterValue,
  type DataTableFilterValues,
} from "@/types/table.types";
import Loader from "../Loader";
import DataTableFilters from "./DataTableFilters";
import DataTablePagination from "./DataTablePagination";
import DataTableSearch from "./DataTableSearch";

export interface DataTableActions<TData> {
  onView?: (data: TData) => void;
  onEdit?: (data: TData) => void;
  onDelete?: (data: TData) => void;
}

interface DataTableProps<TData extends RowData> {
  data: TData[];
  columns: AppColumnDef<TData>[];
  actions?: DataTableActions<TData>;
  /** Usually the Create modal trigger. */
  toolbarAction?: React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;

  /** Passing this flips the table into server-managed sorting. */
  sorting?: {
    state: SortingState;
    onSortingChange: (state: SortingState) => void;
  };
  /** Passing this flips the table into server-managed pagination. */
  pagination?: {
    state: PaginationState;
    onPaginationChange: (state: PaginationState) => void;
  };
  search?: {
    initialValue?: string;
    placeholder?: string;
    debounceMs?: number;
    onDebouncedChange: (value: string) => void;
  };
  filters?: {
    configs: DataTableFilterConfig[];
    values: DataTableFilterValues;
    onFilterChange: (filterId: string, value: DataTableFilterValue | undefined) => void;
    onClearAll?: () => void;
  };
  meta?: PaginationMeta;
}

/**
 * The single table component for the whole app.
 *
 * Built on TanStack Table v9 (`useTable` + an explicit feature set), not the v8
 * `useReactTable` API — see `lib/table/features.ts`.
 *
 * Client-side by default; passing `sorting` or `pagination` switches that axis
 * to server-managed. Never define an actions column yourself — pass `actions`
 * and it is appended here, so every table in the product has it in the same
 * place with the same markup.
 */
const DataTable = <TData extends RowData,>({
  data,
  columns,
  actions,
  toolbarAction,
  emptyMessage = "No records found.",
  isLoading = false,
  sorting,
  pagination,
  search,
  filters,
  meta,
}: DataTableProps<TData>) => {
  // The loading overlay must not render on the server: isLoading is derived
  // from client query state, so painting it during SSR would mismatch on the
  // very first frame.
  const hasHydrated = useHasHydrated();

  const resolvedColumns = useMemo<AppColumnDef<TData>[]>(() => {
    if (!actions) return columns;

    const hasAnyAction = Boolean(actions.onView || actions.onEdit || actions.onDelete);
    if (!hasAnyAction) return columns;

    return [
      ...columns,
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Row actions">
                <RiMoreLine className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Each item exists only if its handler does — a disabled action
                  is `undefined`, not a no-op, so nothing dead is rendered. */}
              {actions.onView && (
                <DropdownMenuItem onSelect={() => actions.onView?.(row.original)}>
                  View
                </DropdownMenuItem>
              )}
              {actions.onEdit && (
                <DropdownMenuItem onSelect={() => actions.onEdit?.(row.original)}>
                  Edit
                </DropdownMenuItem>
              )}
              {actions.onDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => actions.onDelete?.(row.original)}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
  }, [columns, actions]);

  const isServerSorted = Boolean(sorting);
  const isServerPaginated = Boolean(pagination);

  const table = useTable({
    features: appTableFeatures,
    data,
    columns: resolvedColumns,

    manualSorting: isServerSorted,
    manualPagination: isServerPaginated,
    // -1 tells the table the page count is unknown; meta.totalPages is the
    // authority whenever the server sent one.
    pageCount: isServerPaginated ? (meta?.totalPages ?? -1) : undefined,
    rowCount: isServerPaginated ? meta?.total : undefined,

    state: {
      ...(sorting ? { sorting: sorting.state } : {}),
      ...(pagination ? { pagination: pagination.state } : {}),
    },

    onSortingChange: sorting
      ? (updater) => {
          const next =
            typeof updater === "function" ? updater(sorting.state) : updater;
          sorting.onSortingChange(next);
        }
      : undefined,

    onPaginationChange: pagination
      ? (updater) => {
          const next =
            typeof updater === "function" ? updater(pagination.state) : updater;
          pagination.onPaginationChange(next);
        }
      : undefined,
  });

  const rows = table.getRowModel().rows;
  const showOverlay = hasHydrated && isLoading;

  return (
    <div className="space-y-4">
      {(search || toolbarAction) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {search && (
            <DataTableSearch
              initialValue={search.initialValue}
              placeholder={search.placeholder}
              debounceMs={search.debounceMs}
              onDebouncedChange={search.onDebouncedChange}
            />
          )}
          {toolbarAction && <div className="sm:ml-auto">{toolbarAction}</div>}
        </div>
      )}

      {filters && (
        <DataTableFilters
          configs={filters.configs}
          values={filters.values}
          onFilterChange={filters.onFilterChange}
          onClearAll={filters.onClearAll}
          disabled={isLoading}
        />
      )}

      <div className="relative rounded-lg border bg-card">
        {showOverlay && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[1px]">
            <Loader size={32} label="Loading records" />
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDirection = header.column.getIsSorted();

                    return (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder ? null : canSort ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="-ml-2 h-8 gap-1 data-[state=open]:bg-accent"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <table.FlexRender header={header} />
                            {sortDirection === "asc" ? (
                              <RiArrowUpLine className="size-3.5" aria-hidden="true" />
                            ) : sortDirection === "desc" ? (
                              <RiArrowDownLine className="size-3.5" aria-hidden="true" />
                            ) : (
                              <RiExpandUpDownLine
                                className="size-3.5 opacity-50"
                                aria-hidden="true"
                              />
                            )}
                            <span className="sr-only">
                              {sortDirection === "asc"
                                ? "sorted ascending"
                                : sortDirection === "desc"
                                  ? "sorted descending"
                                  : "not sorted"}
                            </span>
                          </Button>
                        ) : (
                          <table.FlexRender header={header} />
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={resolvedColumns.length}
                    className="h-32 text-center text-sm text-muted-foreground"
                  >
                    {isLoading ? "Loading..." : emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cn("align-middle")}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && meta && (
          <DataTablePagination
            pageIndex={pagination.state.pageIndex}
            pageSize={pagination.state.pageSize}
            pageCount={meta.totalPages}
            totalItems={meta.total}
            disabled={isLoading}
            onPageChange={(pageIndex) =>
              pagination.onPaginationChange({ ...pagination.state, pageIndex })
            }
            onPageSizeChange={(pageSize) =>
              pagination.onPaginationChange({ pageIndex: 0, pageSize })
            }
          />
        )}
      </div>
    </div>
  );
};

export default DataTable;
