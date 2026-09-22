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
import { buildBalanceBars, collectedShare } from "@/lib/balanceBars";
import { formatCurrency, formatCurrencyCompact, formatPercent } from "@/lib/format";
import { getCustomerDashboard } from "@/services/customer.services";

const chartConfig = {
  balance: { label: "Due", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** Who owes the most — the list a collections call starts from. */
const CustomerDuesChart = () => {
  const { data } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
  });

  // `?? []` is a new array each render, which would rebuild the bars every time.
  const customers = useMemo(() => data?.data.data ?? [], [data]);
  const { bars, hiddenCount, hiddenTotal } = useMemo(
    () =>
      buildBalanceBars(
        customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          balance: customer.currentDue,
        })),
      ),
    [customers],
  );

  const summary = data?.data.summary;
  const collected = summary
    ? collectedShare(summary.totalPurchase, summary.totalCollections)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who owes the most</CardTitle>
        <CardDescription>
          {hiddenCount > 0
            ? `The top ${bars.length}. ${hiddenCount} more owe ${formatCurrency(hiddenTotal)} between them.`
            : "Every customer with a balance owing."}
          {collected !== null && ` ${formatPercent(collected, 0)} of everything billed is in.`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {bars.length === 0 ? (
          <div className="flex h-50 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nobody owes anything. A sale on credit shows up here.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-60 w-full">
            <BarChart
              data={bars}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
                tickFormatter={(value) => formatCurrencyCompact(Number(value))}
              />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={120}
                tick={AXIS_TICK}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />
                }
              />
              <Bar
                dataKey="balance"
                fill="var(--color-balance)"
                radius={[0, 4, 4, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerDuesChart;
