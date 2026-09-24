"use client";

import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { shapeSlices, slicesTotal, type ChartSlice } from "@/lib/chartSlices";
import { formatCurrency, formatCurrencyCompact, formatPercent } from "@/lib/format";

interface BreakdownDonutProps {
  title: string;
  description: string;
  slices: ChartSlice[];
  /** Printed under the figure in the middle of the ring. */
  centreCaption: string;
  /** Shown in place of the ring when nothing is drawable. */
  emptyText: string;
  /** Money by default; pass a plain formatter for counts. */
  formatValue?: (value: number) => string;
  formatCentre?: (value: number) => string;
  className?: string;
}

/**
 * One ring, a figure in the middle, and a legend that reads as a small table.
 *
 * Every dashboard in the product needed the same picture — how one total
 * divides — and five of them were about to grow their own. The shape lives
 * here so a slice, its legend row and the total in the middle cannot drift
 * apart, and so a caller only has to decide what the slices mean.
 *
 * Colours arrive as theme expressions on each slice, never as hex, so the
 * ring follows the dark theme like everything else.
 */
const BreakdownDonut = ({
  title,
  description,
  slices,
  centreCaption,
  emptyText,
  formatValue = (value) => formatCurrency(value, { whole: true }),
  formatCentre = formatCurrencyCompact,
  className,
}: BreakdownDonutProps) => {
  const shaped = useMemo(() => shapeSlices(slices), [slices]);
  const total = useMemo(() => slicesTotal(slices), [slices]);

  // Recharts reads its colours through --color-<key>, which ChartContainer
  // writes from this config.
  const chartConfig = useMemo(
    () =>
      Object.fromEntries(
        slices.map((slice) => [slice.key, { label: slice.label, color: slice.color }]),
      ) satisfies ChartConfig,
    [slices],
  );

  const data = useMemo(
    () => shaped.map((slice) => ({ ...slice, fill: `var(--color-${slice.key})` })),
    [shaped],
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-center">
        {data.length === 0 ? (
          <div className="flex h-50 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <ChartContainer config={chartConfig} className="aspect-square h-50 shrink-0">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      nameKey="key"
                      formatter={(value, _name, item) => (
                        <div className="flex w-full items-center justify-between gap-3">
                          <span className="text-muted-foreground">{item.payload.label}</span>
                          <span className="font-mono font-medium tabular-nums">
                            {formatValue(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie data={data} dataKey="value" nameKey="key" innerRadius={58} strokeWidth={3}>
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                      const { cx, cy } = viewBox as { cx: number; cy: number };
                      return (
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={cx} y={cy - 6} className="fill-foreground text-lg font-semibold">
                            {formatCentre(total)}
                          </tspan>
                          <tspan x={cx} y={cy + 14} className="fill-muted-foreground text-xs">
                            {centreCaption}
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Capped: these cards run the full width of a page, and an
                uncapped list threw the figure and the share against the far
                edge, a hand-span from the label they belong to. */}
            <ul className="w-full max-w-xl space-y-3">
              {data.map((slice) => (
                <li key={slice.key} className="flex items-center gap-3 text-sm">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {slice.label}
                    {slice.note && (
                      <span className="ml-1 text-xs text-muted-foreground">({slice.note})</span>
                    )}
                  </span>
                  <span className="font-medium tabular-nums">{formatValue(slice.value)}</span>
                  <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                    {formatPercent(slice.share, 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BreakdownDonut;
