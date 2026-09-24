"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  buildTrendHighlights,
  buildTrendPoints,
  isTrendEmpty,
  type TrendMetric,
} from "@/lib/dashboardCharts";
import { formatCurrency, formatCurrencyCompact, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type ITrendMonth } from "@/types/dashboard.types";
import { AXIS_TICK } from "./chartTheme";

// Colours come from the theme tokens, so dark mode follows automatically.
// Sales is the brand blue, which is what the sky-blue wash under the line is
// made of; profit and expenses keep their own hues so the three views cannot
// be mistaken for one another at a glance.
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

/** Up is good, except for expenses. */
const changeIsGood = (change: number, metric: TrendMetric) =>
  metric === "expenses" ? change <= 0 : change >= 0;

/**
 * One metric at a time, on its own scale. Drawn together, profit — a few
 * percent of sales — would be a sliver along the axis, which is exactly the
 * figure an owner most wants to read.
 *
 * An area rather than bars: six months is a shape, not six separate readings,
 * and the wash under the line is where the brand's sky blue does the work.
 */
const TrendChart = ({ trend }: { trend: ITrendMonth[] }) => {
  const [metric, setMetric] = useState<TrendMetric>("sales");
  const points = useMemo(() => buildTrendPoints(trend), [trend]);
  const highlights = useMemo(() => buildTrendHighlights(points, metric), [points, metric]);

  // The gradient is referenced by url(#id), so it needs an id unique to this
  // instance and identical on the server and the client. useId gives that, but
  // React's format carries punctuation that has no business in a URL fragment.
  const gradientId = `trend-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const active = METRICS.find((m) => m.key === metric)!;
  const empty = isTrendEmpty(trend, metric);
  const total = trend.reduce((sum, m) => sum + m[metric], 0);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Last 6 months</CardTitle>
          <CardDescription>
            {formatCurrency(total, { whole: true })} in {active.label.toLowerCase()}
          </CardDescription>
        </div>

        <div role="group" aria-label="Metric" className="flex rounded-full border p-0.5">
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
          // The figures read first, the shape second. On a phone they sit side
          // by side above the chart; from sm up they stack into a rail beside
          // it. min-w-0 on the chart track: without it the track cannot shrink
          // below the chart's own width and the page scrolls sideways.
          <div className="grid gap-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
            <div className="flex gap-3 sm:flex-col">
              {highlights.map((highlight) => (
                <div key={highlight.label} className="min-w-0 flex-1 rounded-xl bg-gradient-panel p-3">
                  <p className="truncate text-xl font-semibold tabular-nums">
                    {formatCurrencyCompact(highlight.value)}
                  </p>

                  {highlight.change !== null && (
                    <span
                      className={cn(
                        "mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        changeIsGood(highlight.change, metric)
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive",
                      )}
                    >
                      {highlight.change > 0 ? "+" : ""}
                      {formatPercent(highlight.change, 0)}
                    </span>
                  )}

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {highlight.label}
                    {highlight.isCurrent && " so far"}
                  </p>
                </div>
              ))}
            </div>

            <div className="min-w-0">
              <ChartContainer config={chartConfig} className="aspect-auto h-60 w-full">
                <AreaChart data={points} margin={{ top: 8, left: 4, right: 8 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      {/* Stronger than a chart on white would need: the card it sits
                          on already carries the brand wash, so a faint fill disappears
                          into it. */}
                      <stop offset="0%" stopColor={`var(--color-${metric})`} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={`var(--color-${metric})`} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>

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
                  <Area
                    dataKey={metric}
                    // monotone, not natural: a natural spline overshoots
                    // between points, so a dip drew lower than the month that
                    // made it and a run of zeroes fell below the axis.
                    type="monotone"
                    stroke={`var(--color-${metric})`}
                    strokeWidth={2.5}
                    fill={`url(#${gradientId})`}
                    // Anchored at zero, not at the foot of the chart, so a
                    // month that lost money is shaded below the axis instead
                    // of being filled as though it were a gain.
                    baseValue={0}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ChartContainer>

              <p className="mt-2 text-xs text-muted-foreground">
                The last point is this month so far.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;
