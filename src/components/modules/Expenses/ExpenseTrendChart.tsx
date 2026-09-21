"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AXIS_TICK } from "@/components/modules/Dashboard/Home/chartTheme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { buildTrendPoints, isTrendEmpty } from "@/lib/dashboardCharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { getDashboardSummary } from "@/services/dashboard.services";

const chartConfig = {
  expenses: { label: "Spent", color: "var(--chart-4)" },
} satisfies ChartConfig;

/**
 * Spending month by month. The figures come from the dashboard summary, which
 * every plan can read — the Reports module is a paid feature, and a chart of
 * one's own spending should not be.
 */
const ExpenseTrendChart = () => {
  const { data } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => getDashboardSummary(),
  });

  // Memoised before use: `?? []` is a new array on every render, which would
  // make the points below rebuild each time.
  const trend = useMemo(() => data?.data.trend ?? [], [data]);
  const points = useMemo(() => buildTrendPoints(trend), [trend]);
  const empty = isTrendEmpty(trend, "expenses");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending month by month</CardTitle>
        <CardDescription>The last six months, including this one.</CardDescription>
      </CardHeader>

      <CardContent>
        {empty ? (
          <div className="flex h-50 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">No expenses recorded in this window.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-50 w-full">
            <BarChart data={points} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={AXIS_TICK}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={AXIS_TICK}
                tickFormatter={(value) => formatCurrencyCompact(Number(value))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelKey="fullLabel"
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Bar
                dataKey="expenses"
                fill="var(--color-expenses)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseTrendChart;
