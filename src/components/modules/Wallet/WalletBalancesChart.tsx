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
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { buildWalletBars } from "@/lib/walletCharts";
import { getWalletHolders } from "@/services/wallet.services";

const chartConfig = {
  balance: { label: "Held", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** Who is holding the most, so a large balance cannot sit unnoticed. */
const WalletBalancesChart = () => {
  const { data } = useQuery({
    queryKey: ["wallet-holders"],
    queryFn: () => getWalletHolders(),
  });

  // `?? []` is a new array each render, which would rebuild the bars every time.
  const holders = useMemo(() => data?.data ?? [], [data]);
  const { bars, hiddenCount, hiddenTotal } = useMemo(() => buildWalletBars(holders), [holders]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biggest balances</CardTitle>
        <CardDescription>
          {hiddenCount > 0
            ? `The top ${bars.length}. ${hiddenCount} more customers hold ${formatCurrency(hiddenTotal)} between them.`
            : "Every customer currently in credit."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {bars.length === 0 ? (
          <div className="flex h-50 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nobody is in credit. A collection taken before there is an invoice shows up here.
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
                content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
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

export default WalletBalancesChart;
