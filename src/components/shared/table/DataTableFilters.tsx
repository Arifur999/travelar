"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  hasFilterValue,
  isRangeFilterValue,
  type DataTableFilterConfig,
  type DataTableFilterValue,
  type DataTableFilterValues,
  type RangeFilterValue,
} from "@/types/table.types";

interface DataTableFiltersProps {
  configs: DataTableFilterConfig[];
  values: DataTableFilterValues;
  onFilterChange: (filterId: string, value: DataTableFilterValue | undefined) => void;
  onClearAll?: () => void;
  disabled?: boolean;
}

const ALL_VALUE = "__all__";

const MultiSelectFilter = ({
  config,
  value,
  onApply,
  disabled,
}: {
  config: Extract<DataTableFilterConfig, { type: "multi-select" }>;
  value: string[];
  onApply: (next: string[] | undefined) => void;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  // Staged locally so ticking three boxes is one server round-trip, not three.
  const [draft, setDraft] = useState<string[]>(value);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) setDraft(value);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          {config.label}
          {value.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5">
              {value.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-56 space-y-3">
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {config.options.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={`${config.filterId}-${option.value}`}
                checked={draft.includes(option.value)}
                onCheckedChange={(checked) =>
                  setDraft((current) =>
                    checked
                      ? [...current, option.value]
                      : current.filter((item) => item !== option.value),
                  )
                }
              />
              <Label
                htmlFor={`${config.filterId}-${option.value}`}
                className="text-sm font-normal"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>

        <div className="flex justify-between gap-2 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft([]);
              onApply(undefined);
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onApply(draft.length > 0 ? draft : undefined);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const RangeFilter = ({
  config,
  value,
  onApply,
  disabled,
}: {
  config: Extract<DataTableFilterConfig, { type: "range" }>;
  value: RangeFilterValue;
  onApply: (next: RangeFilterValue | undefined) => void;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RangeFilterValue>(value);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) setDraft(value);
  };

  const isActive = Boolean(value.gte || value.lte);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          {config.label}
          {isActive && (
            <Badge variant="secondary" className="ml-1 px-1.5">
              1
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${config.filterId}-gte`} className="text-xs">
              Min
            </Label>
            <Input
              id={`${config.filterId}-gte`}
              type="number"
              value={draft.gte ?? ""}
              placeholder={config.minPlaceholder}
              onChange={(event) =>
                setDraft((current) => ({ ...current, gte: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${config.filterId}-lte`} className="text-xs">
              Max
            </Label>
            <Input
              id={`${config.filterId}-lte`}
              type="number"
              value={draft.lte ?? ""}
              placeholder={config.maxPlaceholder}
              onChange={(event) =>
                setDraft((current) => ({ ...current, lte: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex justify-between gap-2 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft({});
              onApply(undefined);
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const next = {
                gte: draft.gte?.trim() || undefined,
                lte: draft.lte?.trim() || undefined,
              };
              onApply(next.gte || next.lte ? next : undefined);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/** Human-readable chip text for an applied filter. */
const describeValue = (
  config: DataTableFilterConfig,
  value: DataTableFilterValue,
): string => {
  if (config.type === "range" && isRangeFilterValue(value)) {
    if (value.gte && value.lte) return `${config.label}: ${value.gte} – ${value.lte}`;
    if (value.gte) return `${config.label}: from ${value.gte}`;
    return `${config.label}: up to ${value.lte}`;
  }

  const labelFor = (raw: string) =>
    config.type === "range"
      ? raw
      : (config.options.find((option) => option.value === raw)?.label ?? raw);

  if (Array.isArray(value)) return `${config.label}: ${value.map(labelFor).join(", ")}`;
  return `${config.label}: ${labelFor(String(value))}`;
};

const DataTableFilters = ({
  configs,
  values,
  onFilterChange,
  onClearAll,
  disabled,
}: DataTableFiltersProps) => {
  if (configs.length === 0) return null;

  const activeConfigs = configs.filter((config) => hasFilterValue(values[config.filterId]));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-muted-foreground" aria-hidden="true" />

        {configs.map((config) => {
          const value = values[config.filterId];

          if (config.type === "multi-select") {
            return (
              <MultiSelectFilter
                key={config.filterId}
                config={config}
                value={Array.isArray(value) ? value : []}
                onApply={(next) => onFilterChange(config.filterId, next)}
                disabled={disabled}
              />
            );
          }

          if (config.type === "range") {
            return (
              <RangeFilter
                key={config.filterId}
                config={config}
                value={isRangeFilterValue(value) ? value : {}}
                onApply={(next) => onFilterChange(config.filterId, next)}
                disabled={disabled}
              />
            );
          }

          return (
            <Select
              key={config.filterId}
              value={typeof value === "string" && value ? value : ALL_VALUE}
              disabled={disabled}
              onValueChange={(next) =>
                onFilterChange(config.filterId, next === ALL_VALUE ? undefined : next)
              }
            >
              <SelectTrigger className="h-9 w-auto min-w-36" aria-label={config.label}>
                <SelectValue placeholder={config.label} />
              </SelectTrigger>
              <SelectContent>
                {/* Radix Select forbids an empty-string value, so "all" needs a
                    sentinel rather than "". */}
                <SelectItem value={ALL_VALUE}>All {config.label.toLowerCase()}</SelectItem>
                {config.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {activeConfigs.length > 0 && onClearAll && (
          <Button type="button" variant="ghost" size="sm" onClick={onClearAll} disabled={disabled}>
            Clear all
          </Button>
        )}
      </div>

      {activeConfigs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeConfigs.map((config) => (
            <Badge key={config.filterId} variant="secondary" className="gap-1 pr-1">
              {describeValue(config, values[config.filterId] as DataTableFilterValue)}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-4 hover:bg-transparent"
                onClick={() => onFilterChange(config.filterId, undefined)}
                aria-label={`Remove ${config.label} filter`}
              >
                <X className="size-3" aria-hidden="true" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataTableFilters;
