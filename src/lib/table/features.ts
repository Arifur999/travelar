import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  rowPaginationFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  type CellContext,
  type ColumnDef,
  type HeaderContext,
  type Row,
  type RowData,
  type Table,
} from "@tanstack/react-table";

/**
 * TanStack Table v9 — NOT the v8 API.
 *
 * v9 is a rewrite: there is no `useReactTable`, no `getCoreRowModel()`, and
 * `ColumnDef` now takes the feature set as its first type parameter. The
 * package does ship a `@tanstack/react-table/legacy` entry with a v8-shaped
 * `useLegacyTable`, but every symbol in it is marked deprecated on arrival, so
 * this app targets the real v9 API instead of adopting a shim it would have to
 * unwind later.
 *
 * Features are now tree-shaken and declared explicitly. Pinning them once here
 * is what lets a feature slice write `AppColumnDef<ITicket>` instead of
 * repeating the whole feature generic at every column definition.
 *
 * This must stay a module-level constant — the docs are explicit that
 * `tableFeatures` is built statically, outside any component.
 */
export const appTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowSortingFeature,
  rowPaginationFeature,
  // Only used in client-side mode. A server-managed table sets manualSorting /
  // manualPagination, and these become no-ops.
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns,
  sortFns,
});

export type AppTableFeatures = typeof appTableFeatures;

/** What every `<entity>Columns.tsx` exports an array of. */
export type AppColumnDef<TData extends RowData> = ColumnDef<AppTableFeatures, TData>;

export type AppCellContext<TData extends RowData> = CellContext<AppTableFeatures, TData>;
export type AppHeaderContext<TData extends RowData> = HeaderContext<AppTableFeatures, TData>;
export type AppRow<TData extends RowData> = Row<AppTableFeatures, TData>;
export type AppTable<TData extends RowData> = Table<AppTableFeatures, TData>;
