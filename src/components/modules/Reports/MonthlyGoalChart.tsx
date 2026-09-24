"use client";

import { useId, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AXIS_TICK } from "@/components/modules/Dashboard/Home/chartTheme";
import { buildGoalPoints, hasAnyGoal, isGoalSeriesEmpty } from "@/lib/reportCharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { type IMonthlyBreakdownRow } from "@/types/dashboard.types";

const chartConfig = {
  actual: { label: "Sales", color: "var(--chart-1)" },
  goal: { label: "Goal", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

/**
 * Sales against the monthly target, across the year.
 *
 * Goal and actual are the only two series on this page that share a scale by
 * definition, which is what makes them worth drawing together — profit and
 * expenses are a fraction of sales and would lie along the axis. They stay in
 * the table underneath, where a number is the better form anyway.
 */
const MonthlyGoalChart = ({ months }: { months: IMonthlyBreakdownRow[] }) => {
  const points = useMemo(() => buildGoalPoints(months), [months]);
  const showGoal = hasAnyGoal(points);
  const empty = isGoalSeriesEmpty(points);

  // url(#id) needs an id unique to this instance and the same on the server as
  // in the browser; React's own format carries punctuation a URL fragment
  // cannot hold.
  const gradientId = `goal-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales against target</CardTitle>
        <CardDescription>
          {showGoal
            ? "Each month's sales, with the target set for it."
            : "Each month's sales. No target has been set for this year."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {empty ? (
          <div className="flex h-60 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Nothing recorded for this year yet.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-60 w-full">
            <AreaChart data={points} margin={{ top: 8, left: 4, right: 8 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-actual)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-actual)" stopOpacity={0.04} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={AXIS_TICK} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={AXIS_TICK}
                tickFormatter={(value: number) => formatCurrencyCompact(value)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as (typeof points)[number] | undefined;
                      return point?.fullLabel ?? null;
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
                dataKey="actual"
                // monotone, not natural: a natural spline overshoots between
                // points, and with the year's last months at zero it drew the
                // curve below the axis — sales that never happened.
                type="monotone"
                stroke="var(--color-actual)"
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                baseValue={0}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />

              {/* Only when a target exists. A goal line flat along zero would
                  read as a target of nothing that was comfortably beaten. */}
              {showGoal && (
                <Line
                  dataKey="goal"
                  type="monotone"
                  stroke="var(--color-goal)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                />
              )}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyGoalChart;
