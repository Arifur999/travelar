"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

interface DataTablePaginationProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalItems: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
}

const JUMP = 5;

/**
 * A 7-slot window. The ellipsis entries are buttons, not decoration — on a
 * 40-page list, stepping one page at a time to reach page 20 is unusable, so
 * each jumps ±5.
 */
const buildPageSlots = (current: number, total: number): (number | "prev-jump" | "next-jump")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const slots: (number | "prev-jump" | "next-jump")[] = [1];

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) slots.push("prev-jump");
  for (let page = start; page <= end; page += 1) slots.push(page);
  if (end < total - 1) slots.push("next-jump");

  slots.push(total);
  return slots;
};

const DataTablePagination = ({
  pageIndex,
  pageSize,
  pageCount,
  totalItems,
  onPageChange,
  onPageSizeChange,
  disabled,
}: DataTablePaginationProps) => {
  const [isCustomSize, setIsCustomSize] = useState(!DEFAULT_PAGE_SIZES.includes(pageSize));

  const currentPage = pageIndex + 1;
  const safePageCount = Math.max(pageCount, 1);
  const canPrevious = currentPage > 1;
  const canNext = currentPage < safePageCount;

  const goTo = (page: number) => {
    const clamped = Math.min(Math.max(page, 1), safePageCount);
    if (clamped !== currentPage) onPageChange(clamped - 1);
  };

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-muted-foreground">
        Total {formatNumber(totalItems)} {totalItems === 1 ? "item" : "items"},{" "}
        {formatNumber(safePageCount)} {safePageCount === 1 ? "page" : "pages"}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows</span>

          {isCustomSize ? (
            <Input
              type="number"
              min={1}
              max={500}
              defaultValue={pageSize}
              aria-label="Rows per page"
              disabled={disabled}
              className="h-9 w-20"
              onBlur={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next) && next >= 1 && next !== pageSize) {
                  onPageSizeChange(Math.min(next, 500));
                }
              }}
            />
          ) : (
            <Select
              value={String(pageSize)}
              disabled={disabled}
              onValueChange={(next) => {
                if (next === "custom") {
                  setIsCustomSize(true);
                  return;
                }
                onPageSizeChange(Number(next));
              }}
            >
              <SelectTrigger className="h-9 w-24" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          )}

          {isCustomSize && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCustomSize(false);
                if (!DEFAULT_PAGE_SIZES.includes(pageSize)) onPageSizeChange(DEFAULT_PAGE_SIZES[0]);
              }}
            >
              Presets
            </Button>
          )}
        </div>

        <nav className="flex items-center gap-1" aria-label="Pagination">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-full"
            onClick={() => goTo(1)}
            disabled={!canPrevious || disabled}
            aria-label="First page"
          >
            <ChevronsLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-full"
            onClick={() => goTo(currentPage - 1)}
            disabled={!canPrevious || disabled}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>

          {buildPageSlots(currentPage, safePageCount).map((slot, index) => {
            if (slot === "prev-jump" || slot === "next-jump") {
              const target =
                slot === "prev-jump" ? currentPage - JUMP : currentPage + JUMP;
              return (
                <Button
                  key={`${slot}-${index}`}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 rounded-full"
                  onClick={() => goTo(target)}
                  disabled={disabled}
                  aria-label={`Jump ${slot === "prev-jump" ? "back" : "forward"} ${JUMP} pages`}
                >
                  …
                </Button>
              );
            }

            return (
              <Button
                key={slot}
                type="button"
                variant={slot === currentPage ? "default" : "outline"}
                size="icon"
                className={cn("size-10 rounded-full", slot === currentPage && "pointer-events-none")}
                onClick={() => goTo(slot)}
                disabled={disabled}
                aria-label={`Page ${slot}`}
                aria-current={slot === currentPage ? "page" : undefined}
              >
                {slot}
              </Button>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-full"
            onClick={() => goTo(currentPage + 1)}
            disabled={!canNext || disabled}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-full"
            onClick={() => goTo(safePageCount)}
            disabled={!canNext || disabled}
            aria-label="Last page"
          >
            <ChevronsRight className="size-4" aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </div>
  );
};

export default DataTablePagination;
