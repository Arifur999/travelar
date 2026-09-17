"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  buildTrendPoints,
  isTrendEmpty,
  monthOverMonth,
  type TrendMetric,
} from "@/lib/dashboardCharts";
import { formatCurrency, formatCurrencyCompact, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type ITrendMonth } from "@/types/dashboard.types";
import { AXIS_TICK } from "./chartTheme";

// Colours come from the theme tokens, so dark mode follows automatically.
const chartConfig = {
  sales: { label: "Sales", color: "var(--chart-1)" },
  profit: { label: "Profit", color: "var(--chart-3)" },
  expenses: { label: "Expenses", color: "var(--chart-4)" },
} satisfies ChartConfig;

const METRICS: { key: TrendMetric; label: string; emptyText: string; emptyHref: string; emptyAction: string }[] = [
  {
    key: "sales",
    label: "Sales",
    emptyText: "No sales in the last six months yet.",
    emptyHref: "/dashboard/tickets",
    emptyAction: "Record a ticket",
  },
  {
    key: "profit",
    label: "Profit",
    emptyText: "No profit recorded in the last six months yet.",
    emptyHref: "/dashboard/tickets",
    emptyAction: "Record a ticket",
  },
  {
    key: "expenses",
    label: "Expenses",
    emptyText: "No expenses in the last six months.",
    emptyHref: "/dashboard/expenses",
    emptyAction: "Record an expense",
  },
];

// Recharts starts a numeric axis at 0 by default, which would cut off a
// month that made a loss. Always include zero, and anything below it.
const includeZero: [(min: number) => number, (max: number) => number] = [
  (min) => Math.min(0, min),
  (max) => Math.max(0, max),
];

/**
 * One metric at a time, on its own scale. Drawn together, profit — a few
 * percent of sales — would be a sliver under the sales bars, which is exactly
 * the figure an owner most wants to read.
 */
const TrendChart = ({ trend }: { trend: ITrendMonth[] }) => {
  const [metric, setMetric] = useState<TrendMetric>("sales");
  const points = useMemo(() => buildTrendPoints(trend), [trend]);

  const active = METRICS.find((m) => m.key === metric)!;
  const empty = isTrendEmpty(trend, metric);
  const total = trend.reduce((sum, m) => sum + m[metric], 0);
  const change = monthOverMonth(trend, metric);

  // For expenses, going up is the bad direction.
  const changeIsGood = change === null ? null : metric === "expenses" ? change <= 0 : change >= 0;

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Last 6 months</CardTitle>
          <CardDescription>
            {formatCurrency(total, { whole: true })} in {active.label.toLowerCase()}
            {change !== null && (
              <span className={cn("ml-2 font-medium", changeIsGood ? "text-success" : "text-destructive")}>
                {change > 0 ? "+" : ""}
                {formatPercent(change, 0)} vs last month so far
              </span>
            )}
          </CardDescription>
        </div>

        <div role="group" aria-label="Metric" className="flex rounded-lg border p-0.5">
          {METRICS.map((m) => (
            <Button
              key={m.key}
              type="button"
              size="sm"
              variant={metric === m.key ? "secondary" : "ghost"}
              aria-pressed={metric === m.key}
              className="h-7 px-3 text-xs"
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {empty ? (
          <div className="flex h-60 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
            <p className="text-sm text-muted-foreground">{active.emptyText}</p>
            <Button asChild size="sm" variant="outline">
              <Link href={active.emptyHref}>{active.emptyAction}</Link>
            </Button>
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="aspect-auto h-60 w-full">
              <BarChart data={points} margin={{ top: 8, left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={AXIS_TICK} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tick={AXIS_TICK}
                  domain={includeZero}
                  tickFormatter={(value: number) => formatCurrencyCompact(value)}
                />
                <ReferenceLine y={0} className="stroke-border" />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const point = payload?.[0]?.payload as (typeof points)[number] | undefined;
                        if (!point) return null;
                        return point.isCurrent ? `${point.fullLabel} (so far)` : point.fullLabel;
                      }}
                      formatter={(value) => (
                        <span className="font-mono font-medium tabular-nums">
                          {formatCurrency(value, { whole: true })}
                        </span>
                      )}
                    />
                  }
                />
                <Bar dataKey={metric} radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {points.map((point) => (
                    <Cell
                      key={point.fullLabel}
                      fill={point[metric] < 0 ? "var(--destructive)" : `var(--color-${metric})`}
                      // The current month is still running; a lighter bar keeps
                      // it from reading as a finished month that fell short.
                      fillOpacity={point.isCurrent ? 0.55 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <p className="mt-2 text-xs text-muted-foreground">
              The lighter bar is this month so far.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;
