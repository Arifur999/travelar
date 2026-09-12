"use client";

import { useCallback } from "react";
import { type ReadonlyURLSearchParams } from "next/navigation";
import { type UpdateParamsFn } from "./useServerManagedDataTable";

interface UseServerManagedDataTableSearchArgs {
  searchParams: ReadonlyURLSearchParams;
  updateParams: UpdateParamsFn;
  /** Matches the backend QueryBuilder's reserved param. */
  queryKey?: string;
}

export const useServerManagedDataTableSearch = ({
  searchParams,
  updateParams,
  queryKey = "searchTerm",
}: UseServerManagedDataTableSearchArgs) => {
  const searchTermFromUrl = searchParams.get(queryKey) ?? "";

  const handleDebouncedSearchChange = useCallback(
    (searchTerm: string) => {
      const trimmed = searchTerm.trim();

      // The debounce can fire with the value already in the URL — on a blur, or
      // when the user types and deletes back to where they started. Pushing
      // history and refreshing for a no-op change costs a full server render.
      if (trimmed === searchTermFromUrl) return;

      updateParams(
        (params) => {
          // Removed entirely rather than left as an empty string: QueryBuilder
          // skips a missing searchTerm, but `?searchTerm=` would still be a
          // param in the URL and make a clean list look filtered.
          if (trimmed === "") params.delete(queryKey);
          else params.set(queryKey, trimmed);
        },
        // A new search on page 7 must land on page 1 — the old page number
        // almost certainly does not exist in the new result set.
        { resetPage: true },
      );
    },
    [queryKey, searchTermFromUrl, updateParams],
  );

  return { searchTermFromUrl, handleDebouncedSearchChange };
};
