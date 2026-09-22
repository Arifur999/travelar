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
import { getSupplierDashboard } from "@/services/supplier.services";

const chartConfig = {
  balance: { label: "Payable", color: "var(--chart-5)" },
} satisfies ChartConfig;

/** Who to pay next — the biggest payables, largest first. */
const SupplierPayablesChart = () => {
  const { data } = useQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: () => getSupplierDashboard(),
  });

  // `?? []` is a new array each render, which would rebuild the bars every time.
  const suppliers = useMemo(() => data?.data.data ?? [], [data]);
  const { bars, hiddenCount, hiddenTotal } = useMemo(
    () =>
      buildBalanceBars(
        suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          balance: supplier.currentPayable,
        })),
      ),
    [suppliers],
  );

  const summary = data?.data.summary;
  const paid = summary ? collectedShare(summary.totalPurchase, summary.totalPaid) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who to pay next</CardTitle>
        <CardDescription>
          {hiddenCount > 0
            ? `The top ${bars.length}. ${hiddenCount} more are owed ${formatCurrency(hiddenTotal)} between them.`
            : "Every supplier with a balance owing."}
          {paid !== null && ` ${formatPercent(paid, 0)} of everything purchased is settled.`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {bars.length === 0 ? (
          <div className="flex h-50 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nothing owed to anyone. A ticket bought on credit shows up here.
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

export default SupplierPayablesChart;
