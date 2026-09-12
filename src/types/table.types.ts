import { type SelectOption } from "./enums.types";

/**
 * Filter shapes, and the contract with the backend QueryBuilder.
 *
 * `filterId` doubles as the backend field name, so there is no translation
 * layer: a dotted id like `"customer.name"` becomes a relation hop server-side
 * because QueryBuilder.buildNestedCondition splits on the dot.
 *
 * Serialization — this must match what `qs` parses in the API:
 *
 *   single | ?status=APPROVED
 *   multi  | ?status=APPROVED&status=DELIVERED   (repeated key -> { in: [...] })
 *   range  | ?fare[gte]=500&fare[lte]=9000       (brackets -> { gte, lte })
 *
 * QueryBuilder only honours operators in its SCALAR_OPERATORS /
 * ARRAY_OPERATORS lists and drops anything else, so the operators below are
 * deliberately limited to the ones it accepts.
 */
export type DataTableFilterType = "single-select" | "multi-select" | "range";

export type RangeFilterValue = { gte?: string; lte?: string };

export type DataTableFilterValue = string | string[] | RangeFilterValue;

export type DataTableFilterValues = Record<string, DataTableFilterValue | undefined>;

interface BaseFilterConfig {
  /** Doubles as the backend field name. */
  filterId: string;
  label: string;
}

export interface SingleSelectFilterConfig extends BaseFilterConfig {
  type: "single-select";
  options: SelectOption[];
}

export interface MultiSelectFilterConfig extends BaseFilterConfig {
  type: "multi-select";
  options: SelectOption[];
}

export interface RangeFilterConfig extends BaseFilterConfig {
  type: "range";
  /** Shown inside the two inputs. */
  minPlaceholder?: string;
  maxPlaceholder?: string;
}

export type DataTableFilterConfig =
  | SingleSelectFilterConfig
  | MultiSelectFilterConfig
  | RangeFilterConfig;

export const isRangeFilterValue = (
  value: DataTableFilterValue | undefined,
): value is RangeFilterValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** True when a filter holds something worth sending or showing as a chip. */
export const hasFilterValue = (value: DataTableFilterValue | undefined): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value.gte?.trim()) || Boolean(value.lte?.trim());
};
