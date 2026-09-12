"use client";

import { useCallback, useMemo } from "react";
import { type ReadonlyURLSearchParams } from "next/navigation";
import {
  isRangeFilterValue,
  type DataTableFilterValue,
  type DataTableFilterValues,
} from "@/types/table.types";
import { type UpdateParamsFn } from "./useServerManagedDataTable";

export type ServerManagedFilterKind = "single" | "multi" | "range";

export interface ServerManagedFilterDefinition {
  filterId: string;
  kind: ServerManagedFilterKind;
  /** Backend field name. Defaults to filterId, which is almost always right. */
  queryKey: string;
  /** Range operators to serialize. Only ones QueryBuilder accepts. */
  operators: string[];
}

export const DEFAULT_RANGE_OPERATORS = ["gte", "lte"] as const;

/**
 * Factory for the definitions a table passes in. Keeping it a factory means a
 * definition always has every field filled in, so the hook never has to guess
 * a default halfway through serializing.
 */
export const serverManagedFilter = {
  single: (filterId: string, queryKey = filterId): ServerManagedFilterDefinition => ({
    filterId,
    kind: "single",
    queryKey,
    operators: [],
  }),
  multi: (filterId: string, queryKey = filterId): ServerManagedFilterDefinition => ({
    filterId,
    kind: "multi",
    queryKey,
    operators: [],
  }),
  range: (
    filterId: string,
    queryKey = filterId,
    operators: string[] = [...DEFAULT_RANGE_OPERATORS],
  ): ServerManagedFilterDefinition => ({ filterId, kind: "range", queryKey, operators }),
};

interface UseServerManagedDataTableFiltersArgs {
  searchParams: ReadonlyURLSearchParams;
  definitions: ServerManagedFilterDefinition[];
  updateParams: UpdateParamsFn;
}

/**
 * Reads filter state out of the URL and writes it back in the exact shape the
 * backend `qs` parser expects:
 *
 *   single | ?status=APPROVED
 *   multi  | ?status=APPROVED&status=DELIVERED
 *   range  | ?fare[gte]=500&fare[lte]=9000
 */
export const useServerManagedDataTableFilters = ({
  searchParams,
  definitions,
  updateParams,
}: UseServerManagedDataTableFiltersArgs) => {
  const filterValues = useMemo<DataTableFilterValues>(() => {
    const values: DataTableFilterValues = {};

    for (const definition of definitions) {
      if (definition.kind === "range") {
        const range: { gte?: string; lte?: string } = {};
        for (const operator of definition.operators) {
          const value = searchParams.get(`${definition.queryKey}[${operator}]`);
          if (value) range[operator as "gte" | "lte"] = value;
        }
        if (range.gte || range.lte) values[definition.filterId] = range;
        continue;
      }

      if (definition.kind === "multi") {
        const all = searchParams.getAll(definition.queryKey);
        if (all.length > 0) values[definition.filterId] = all;
        continue;
      }

      const value = searchParams.get(definition.queryKey);
      if (value) values[definition.filterId] = value;
    }

    return values;
  }, [definitions, searchParams]);

  /** Clears every param a definition owns, so a rewrite never leaves a stale key. */
  const deleteFilterParams = useCallback(
    (params: URLSearchParams, definition: ServerManagedFilterDefinition) => {
      if (definition.kind === "range") {
        for (const operator of definition.operators) {
          params.delete(`${definition.queryKey}[${operator}]`);
        }
        return;
      }
      params.delete(definition.queryKey);
    },
    [],
  );

  const handleFilterChange = useCallback(
    (filterId: string, value: DataTableFilterValue | undefined) => {
      const definition = definitions.find((item) => item.filterId === filterId);
      if (!definition) return;

      updateParams(
        (params) => {
          deleteFilterParams(params, definition);

          if (value === undefined) return;

          if (definition.kind === "range" && isRangeFilterValue(value)) {
            for (const operator of definition.operators) {
              const operand = value[operator as "gte" | "lte"]?.trim();
              if (operand) params.append(`${definition.queryKey}[${operator}]`, operand);
            }
            return;
          }

          if (definition.kind === "multi" && Array.isArray(value)) {
            // Repeated keys, not a comma-joined string — that is what QueryBuilder
            // turns into a Prisma `{ in: [...] }`.
            for (const item of value) params.append(definition.queryKey, item);
            return;
          }

          if (typeof value === "string" && value.trim() !== "") {
            params.set(definition.queryKey, value.trim());
          }
        },
        { resetPage: true },
      );
    },
    [definitions, deleteFilterParams, updateParams],
  );

  const clearAllFilters = useCallback(() => {
    updateParams(
      (params) => {
        for (const definition of definitions) deleteFilterParams(params, definition);
      },
      { resetPage: true },
    );
  }, [definitions, deleteFilterParams, updateParams]);

  return { filterValues, handleFilterChange, clearAllFilters };
};
