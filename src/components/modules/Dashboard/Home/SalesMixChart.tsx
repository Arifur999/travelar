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
import { buildSalesMix } from "@/lib/dashboardCharts";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/format";
import { type IModuleBreakdown } from "@/types/dashboard.types";

// Each module keeps the accent it has everywhere else in the product.
const chartConfig = {
  ticketing: { label: "Tickets", color: "var(--chart-1)" },
  visa: { label: "Visa", color: "var(--chart-2)" },
  hajj: { label: "Hajj & Umrah", color: "var(--chart-3)" },
  tours: { label: "Tours", color: "var(--chart-4)" },
  hotels: { label: "Hotel", color: "var(--chart-5)" },
} satisfies ChartConfig;

const DOT_CLASSES = {
  ticketing: "bg-chart-1",
  visa: "bg-chart-2",
  hajj: "bg-chart-3",
  tours: "bg-chart-4",
  hotels: "bg-chart-5",
} as const;

const SalesMixChart = ({ byModule }: { byModule: IModuleBreakdown }) => {
  const slices = useMemo(
    () => buildSalesMix(byModule).map((slice) => ({ ...slice, fill: `var(--color-${slice.module})` })),
    [byModule],
  );
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where this month&apos;s sales came from</CardTitle>
        <CardDescription>Share of sales by module.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-center">
        {slices.length === 0 ? (
          <div className="flex h-50 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">No sales this month yet.</p>
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
                      nameKey="module"
                      formatter={(value, _name, item) => (
                        <div className="flex w-full items-center justify-between gap-3">
                          <span className="text-muted-foreground">{item.payload.label}</span>
                          <span className="font-mono font-medium tabular-nums">
                            {formatCurrency(value, { whole: true })}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie data={slices} dataKey="value" nameKey="module" innerRadius={58} strokeWidth={3}>
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                      const { cx, cy } = viewBox as { cx: number; cy: number };
                      return (
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={cx} y={cy - 6} className="fill-foreground text-lg font-semibold">
                            {formatCurrencyCompact(total)}
                          </tspan>
                          <tspan x={cx} y={cy + 14} className="fill-muted-foreground text-xs">
                            this month
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            <ul className="w-full space-y-3">
              {slices.map((slice) => (
                <li key={slice.module} className="flex items-center gap-3 text-sm">
                  <span className={`size-2.5 shrink-0 rounded-full ${DOT_CLASSES[slice.module]}`} aria-hidden="true" />
                  <span className="flex-1">
                    {slice.label}
                    <span className="ml-1 text-xs text-muted-foreground">({formatNumber(slice.count)})</span>
                  </span>
                  <span className="font-medium tabular-nums">{formatCurrency(slice.value, { whole: true })}</span>
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

export default SalesMixChart;
