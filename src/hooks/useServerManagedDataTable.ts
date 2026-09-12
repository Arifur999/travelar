"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type PaginationState, type SortingState } from "@tanstack/react-table";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;

export type UpdateParamsFn = (
  updater: (params: URLSearchParams) => void,
  options?: { resetPage?: boolean },
) => void;

/**
 * The URL is the single source of truth for page, limit, sortBy and sortOrder.
 *
 * Param names match the backend QueryBuilder exactly — it treats searchTerm,
 * page, limit, sortBy, sortOrder, fields and include as reserved and everything
 * else as a where clause, so a typo here would silently become a filter on a
 * column that does not exist.
 */
export const useServerManagedDataTable = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isRouteRefreshPending, startTransition] = useTransition();

  const queryStringFromUrl = searchParams.toString();

  const sortingFromUrl = useMemo<SortingState>(() => {
    const sortBy = searchParams.get("sortBy");
    if (!sortBy) return [];
    return [{ id: sortBy, desc: searchParams.get("sortOrder") !== "asc" }];
  }, [searchParams]);

  const paginationFromUrl = useMemo<PaginationState>(() => {
    const page = Number(searchParams.get("page")) || DEFAULT_PAGE;
    const limit = Number(searchParams.get("limit")) || DEFAULT_LIMIT;
    return { pageIndex: Math.max(page - 1, 0), pageSize: limit };
  }, [searchParams]);

  /**
   * Local mirrors of the URL state.
   *
   * The table reads these rather than the URL directly, so a sort arrow moves
   * the instant it is clicked instead of after the server round-trip —
   * `updateParams` uses history.pushState, which does not push a new value
   * through `useSearchParams`.
   *
   * They are resynced by comparing during render, not in an effect: React
   * re-runs the component immediately with the new state and discards the
   * in-progress pass, so there is no extra commit and no cascading render.
   * This also covers browser back/forward, which never goes through our own
   * setters.
   */
  const [optimisticSortingState, setOptimisticSortingState] =
    useState<SortingState>(sortingFromUrl);
  const [lastSyncedSorting, setLastSyncedSorting] = useState(sortingFromUrl);
  if (sortingFromUrl !== lastSyncedSorting) {
    setLastSyncedSorting(sortingFromUrl);
    setOptimisticSortingState(sortingFromUrl);
  }

  const [optimisticPaginationState, setOptimisticPaginationState] =
    useState<PaginationState>(paginationFromUrl);
  const [lastSyncedPagination, setLastSyncedPagination] = useState(paginationFromUrl);
  if (paginationFromUrl !== lastSyncedPagination) {
    setLastSyncedPagination(paginationFromUrl);
    setOptimisticPaginationState(paginationFromUrl);
  }

  /**
   * Deliberately NOT router.push.
   *
   * pushState updates the address bar with no scroll reset and no full
   * navigation; the Server Component then re-renders inside a transition, so
   * the current table stays interactive and visible while the next page loads.
   * router.push would scroll to the top on every sort click.
   */
  const updateParams = useCallback<UpdateParamsFn>(
    (updater, options) => {
      const params = new URLSearchParams(searchParams.toString());
      updater(params);

      if (options?.resetPage) params.delete("page");

      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

      window.history.pushState(null, "", nextUrl);
      startTransition(() => router.refresh());
    },
    [pathname, router, searchParams],
  );

  const handleSortingChange = useCallback(
    (nextSorting: SortingState) => {
      setOptimisticSortingState(nextSorting);

      updateParams(
        (params) => {
          const first = nextSorting[0];
          if (!first) {
            params.delete("sortBy");
            params.delete("sortOrder");
            return;
          }
          params.set("sortBy", first.id);
          params.set("sortOrder", first.desc ? "desc" : "asc");
        },
        // A re-sort has to land on page 1: the row that was on page 7 under the
        // old order is somewhere else entirely under the new one.
        { resetPage: true },
      );
    },
    [updateParams],
  );

  const handlePaginationChange = useCallback(
    (nextPagination: PaginationState) => {
      setOptimisticPaginationState(nextPagination);

      updateParams((params) => {
        const page = nextPagination.pageIndex + 1;
        if (page === DEFAULT_PAGE) params.delete("page");
        else params.set("page", String(page));

        if (nextPagination.pageSize === DEFAULT_LIMIT) params.delete("limit");
        else params.set("limit", String(nextPagination.pageSize));
      });
    },
    [updateParams],
  );

  return {
    searchParams,
    queryStringFromUrl,
    optimisticSortingState,
    optimisticPaginationState,
    isRouteRefreshPending,
    updateParams,
    handleSortingChange,
    handlePaginationChange,
  };
};
