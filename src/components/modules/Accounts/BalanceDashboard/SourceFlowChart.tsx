"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AXIS_TICK } from "@/components/modules/Dashboard/Home/chartTheme";
import { buildSourceFlow, isSourceFlowEmpty } from "@/lib/accountCharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { type IAccountOverviewRow } from "@/types/account.types";
import { type PostingSource } from "@/types/enums.types";

const chartConfig = {
  value: { label: "Net", color: "var(--chart-1)" },
} satisfies ChartConfig;

// The matrix below the chart runs to thirteen columns; every figure in it is
// exact. This is the same money grouped the other way — which sources moved
// it, and in which direction — so an owner can see at a glance where the
// month went without reading across.
const includeZero: [(min: number) => number, (max: number) => number] = [
  (min) => Math.min(0, min),
  (max) => Math.max(0, max),
];

const SourceFlowChart = ({
  rows,
  order,
}: {
  rows: IAccountOverviewRow[];
  order: PostingSource[];
}) => {
  const bars = useMemo(() => buildSourceFlow(rows, order), [rows, order]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>What moved the money</CardTitle>
        <CardDescription>
          Every account added together, by what put the money in or took it out.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isSourceFlowEmpty(bars) ? (
          <div className="flex h-60 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nothing has moved through an account yet.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <BarChart data={bars} margin={{ top: 8, left: 4, right: 4, bottom: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={AXIS_TICK}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={64}
              />
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
                    hideLabel
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
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {bars.map((bar) => (
                  <Cell
                    key={bar.key}
                    fill={bar.isNegative ? "var(--destructive)" : "var(--chart-1)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SourceFlowChart;
