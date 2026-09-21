"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Label, Pie, PieChart } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { buildCategorySlices, isCategoryMixEmpty } from "@/lib/expenseCharts";
import { formatCurrency, formatCurrencyCompact, formatPercent } from "@/lib/format";
import { getExpenseDashboard } from "@/services/expense.services";

// Five slices plus a folded tail, so the palette covers every case.
const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
] as const;

const chartConfig = { value: { label: "Spent" } } satisfies ChartConfig;

/** Share of spending per category, with the tail folded into one slice. */
const ExpenseCategoryChart = () => {
  const { data } = useQuery({
    queryKey: ["expense-dashboard"],
    queryFn: () => getExpenseDashboard(),
  });

  const slices = useMemo(
    () =>
      buildCategorySlices(data?.data.byCategory ?? []).map((slice, index) => ({
        ...slice,
        fill: SLICE_COLORS[index] ?? SLICE_COLORS[SLICE_COLORS.length - 1],
      })),
    [data],
  );

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Where it went</CardTitle>
          <CardDescription>Share of spending by category, all time.</CardDescription>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/expenses/categories">Manage categories</Link>
        </Button>
      </CardHeader>

      <CardContent>
        {isCategoryMixEmpty(slices) ? (
          <div className="flex h-50 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nothing spent yet. Record an expense and it will show up here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)] sm:items-center">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-50">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      nameKey="name"
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Pie data={slices} dataKey="value" nameKey="name" innerRadius={55} strokeWidth={4}>
                  <Label
                    content={({ viewBox }) =>
                      viewBox && "cx" in viewBox ? (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-lg font-semibold"
                          >
                            {formatCurrencyCompact(total)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 18}
                            className="fill-muted-foreground text-xs"
                          >
                            spent
                          </tspan>
                        </text>
                      ) : null
                    }
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            <ul className="space-y-2">
              {slices.map((slice) => (
                <li key={slice.key} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.fill }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{slice.name}</span>
                  <span className="shrink-0 tabular-nums">{formatCurrency(slice.value)}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {formatPercent(slice.share)}
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

export default ExpenseCategoryChart;
