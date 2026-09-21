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
import { formatNumber } from "@/lib/format";
import { buildDepartureBars } from "@/lib/tourCharts";
import { getTours } from "@/services/tour.services";

const chartConfig = {
  sold: { label: "Sold", color: "var(--chart-1)" },
  free: { label: "Free", color: "var(--chart-3)" },
} satisfies ChartConfig;

/** How full the next departures are, so a half-empty trip is visible early. */
const TourDeparturesChart = () => {
  const { data } = useQuery({
    queryKey: ["tours"],
    queryFn: () => getTours("limit=200"),
  });

  // `?? []` is a new array each render, which would rebuild the bars every time.
  const tours = useMemo(() => data?.data ?? [], [data]);
  const bars = useMemo(() => buildDepartureBars(tours), [tours]);
  const unlimited = bars.filter((bar) => bar.capacity === null).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next departures</CardTitle>
        <CardDescription>
          Seats sold against seats left, soonest first.
          {unlimited > 0 &&
            ` ${unlimited} of these have no seat limit, so only what is sold is drawn.`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {bars.length === 0 ? (
          <div className="flex h-50 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              No open tours. Add one below and its seats will show up here.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-60 w-full">
            <BarChart data={bars} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
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
                width={40}
                allowDecimals={false}
                tick={AXIS_TICK}
                tickFormatter={(value) => formatNumber(Number(value))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent formatter={(value) => `${formatNumber(Number(value))}`} />
                }
              />
              {/* Stacked, so each column is the whole tour. */}
              <Bar dataKey="sold" stackId="seats" fill="var(--color-sold)" maxBarSize={48} />
              <Bar
                dataKey="free"
                stackId="seats"
                fill="var(--color-free)"
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

export default TourDeparturesChart;
