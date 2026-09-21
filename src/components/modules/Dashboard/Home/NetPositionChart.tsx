"use client";

import { useMemo } from "react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { buildNetPositionBars, isNetPositionEmpty } from "@/lib/dashboardCharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { type ICashFlow } from "@/types/dashboard.types";
import { AXIS_TICK } from "./chartTheme";

const chartConfig = {
  value: { label: "Amount", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Cash, what customers owe, and what is owed to suppliers — with the net the
 * three add up to. Money owed away is drawn below the axis, so a business that
 * looks rich on receivables alone cannot be mistaken for one holding cash.
 */
const NetPositionChart = ({ cashFlow }: { cashFlow: ICashFlow }) => {
  const bars = useMemo(() => buildNetPositionBars(cashFlow), [cashFlow]);
  const empty = isNetPositionEmpty(bars);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where the business stands</CardTitle>
        <CardDescription>
          Cash plus what customers owe, less what you owe suppliers.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {empty ? (
          <div className="flex h-50 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nothing to show yet — record a sale or add an account.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-50 w-full">
            <BarChart data={bars} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={AXIS_TICK}
              />
              <YAxis hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel={false}
                    formatter={(value) => formatCurrency(Math.abs(Number(value)))}
                  />
                }
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
                {bars.map((bar) => (
                  <Cell
                    key={bar.key}
                    fill={
                      bar.isNegative
                        ? "var(--destructive)"
                        : bar.key === "net"
                          ? "var(--chart-2)"
                          : "var(--chart-1)"
                    }
                  />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  className="fill-muted-foreground"
                  fontSize={11}
                  formatter={(value) => formatCurrencyCompact(Math.abs(Number(value)))}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default NetPositionChart;
