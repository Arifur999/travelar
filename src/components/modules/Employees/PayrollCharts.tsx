"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK } from "@/components/modules/Dashboard/Home/chartTheme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { buildPayrollMix, buildTopPaidStaff } from "@/lib/employeeCharts";
import { formatCurrency, formatCurrencyCompact, formatPercent } from "@/lib/format";
import { getEmployeeDashboard } from "@/services/employee.services";

const chartConfig = {
  salary: { label: "Salary", color: "var(--chart-1)" },
  bonus: { label: "Bonus", color: "var(--chart-2)" },
} satisfies ChartConfig;

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-50 items-center justify-center rounded-lg border border-dashed">
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

/** What has been paid out: how it splits, and to whom. */
const PayrollCharts = () => {
  const { data } = useQuery({
    queryKey: ["employee-dashboard"],
    queryFn: () => getEmployeeDashboard(),
  });

  const summary = data?.data.summary;

  const slices = useMemo(
    () =>
      buildPayrollMix({
        totalSalary: summary?.totalSalary ?? 0,
        totalBonus: summary?.totalBonus ?? 0,
      }).map((slice) => ({ ...slice, fill: `var(--color-${slice.key})` })),
    [summary],
  );

  const bars = useMemo(() => buildTopPaidStaff(data?.data.data ?? []), [data]);
  const paid = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Payroll split</CardTitle>
          <CardDescription>Salary against bonus, all time.</CardDescription>
        </CardHeader>
        <CardContent>
          {slices.length === 0 ? (
            <EmptyState message="Nobody has been paid yet." />
          ) : (
            <div className="space-y-3">
              <ChartContainer config={chartConfig} className="mx-auto aspect-square h-45">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        nameKey="label"
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    }
                  />
                  <Pie data={slices} dataKey="value" nameKey="label" innerRadius={50}>
                    <Label
                      content={({ viewBox }) =>
                        viewBox && "cx" in viewBox ? (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-lg font-semibold"
                            >
                              {formatCurrencyCompact(paid)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 18}
                              className="fill-muted-foreground text-xs"
                            >
                              paid
                            </tspan>
                          </text>
                        ) : null
                      }
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>

              <ul className="space-y-1">
                {slices.map((slice) => (
                  <li key={slice.key} className="flex items-center gap-2 text-sm">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.fill }}
                      aria-hidden="true"
                    />
                    <span className="flex-1">{slice.label}</span>
                    <span className="tabular-nums">{formatCurrency(slice.value)}</span>
                    <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                      {formatPercent(slice.share)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Who was paid most</CardTitle>
          <CardDescription>The five biggest, salary and bonus stacked.</CardDescription>
        </CardHeader>
        <CardContent>
          {bars.length === 0 ? (
            <EmptyState message="No payouts recorded yet." />
          ) : (
            <ChartContainer config={chartConfig} className="h-50 w-full">
              <BarChart data={bars} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={AXIS_TICK}
                  tickFormatter={(value) => formatCurrencyCompact(Number(value))}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={96}
                  tick={AXIS_TICK}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="salary" stackId="paid" fill="var(--color-salary)" radius={[4, 0, 0, 4]}>
                  {bars.map((bar) => (
                    <Cell key={bar.key} />
                  ))}
                </Bar>
                <Bar dataKey="bonus" stackId="paid" fill="var(--color-bonus)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollCharts;
