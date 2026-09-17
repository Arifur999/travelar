"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Bar, BarChart, Cell, LabelList, ReferenceLine, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { buildAccountBars } from "@/lib/dashboardCharts";
import { formatCurrency, formatCurrencyCompact, truncate } from "@/lib/format";
import { type ICashFlowAccount } from "@/types/dashboard.types";
import { AXIS_TICK } from "./chartTheme";

const chartConfig = {
  balance: { label: "Balance", color: "var(--chart-5)" },
} satisfies ChartConfig;

const BAR_ROW_HEIGHT = 40;
const NAME_AXIS_WIDTH = 148;

// A horizontal axis starting at 0 would hide an overdrawn account entirely.
const includeZero: [(min: number) => number, (max: number) => number] = [
  (min) => Math.min(0, min),
  (max) => Math.max(0, max),
];

type Coordinate = number | string | undefined;

/**
 * Account names on one line. Recharts wraps tick text at word breaks, which
 * split "Dutch-Bangla Bank" in two; a plain <text> never wraps, and the full
 * name is still there on hover.
 */
const AccountTick = ({ x, y, payload }: { x?: Coordinate; y?: Coordinate; payload?: { value?: unknown } }) => {
  const name = String(payload?.value ?? "");
  return (
    <text x={Number(x)} y={Number(y)} dy={4} textAnchor="end" {...AXIS_TICK}>
      <title>{name}</title>
      {truncate(name, 20)}
    </text>
  );
};

/**
 * The balance beside each bar. Placed after the bar's right-hand edge — which
 * for an overdrawn account is the zero line, not the bar's end. "After the end"
 * would put a negative figure on top of the account's name.
 */
const BalanceLabel = ({
  x,
  y,
  width,
  height,
  value,
}: {
  x?: Coordinate;
  y?: Coordinate;
  width?: Coordinate;
  height?: Coordinate;
  value?: unknown;
}) => {
  const left = Number(x);
  const right = Math.max(left, left + Number(width));
  const amount = Number(value);

  return (
    <text
      x={right + 6}
      y={Number(y) + Number(height) / 2}
      dominantBaseline="middle"
      fontSize={12}
      className={amount < 0 ? "fill-destructive font-medium" : "fill-foreground"}
    >
      {formatCurrencyCompact(amount)}
    </text>
  );
};

const CashByAccountChart = ({ accounts }: { accounts: ICashFlowAccount[] }) => {
  const bars = useMemo(() => buildAccountBars(accounts), [accounts]);
  const overdrawn = bars.filter((bar) => bar.isNegative).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash by account</CardTitle>
        <CardDescription>
          {overdrawn > 0 ? (
            <span className="text-destructive">
              {overdrawn} {overdrawn === 1 ? "account is" : "accounts are"} overdrawn.
            </span>
          ) : (
            "Where the money is right now."
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-center">
        {bars.length === 0 ? (
          <div className="flex h-50 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
            <p className="text-sm text-muted-foreground">No cash accounts yet.</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/accounts">Add an account</Link>
            </Button>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto w-full"
            style={{ height: bars.length * BAR_ROW_HEIGHT + 8 }}
          >
            <BarChart data={bars} layout="vertical" margin={{ left: 0, right: 64, top: 0, bottom: 0 }}>
              <XAxis type="number" hide domain={includeZero} />
              <YAxis
                type="category"
                dataKey="name"
                width={NAME_AXIS_WIDTH}
                tickLine={false}
                axisLine={false}
                tick={AccountTick}
              />
              <ReferenceLine x={0} className="stroke-border" />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideIndicator
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? null}
                    formatter={(value) => (
                      <span className="font-mono font-medium tabular-nums">
                        {formatCurrency(value, { whole: true })}
                      </span>
                    )}
                  />
                }
              />
              <Bar dataKey="balance" radius={4} maxBarSize={24}>
                {bars.map((bar) => (
                  <Cell key={bar.key} fill={bar.isNegative ? "var(--destructive)" : "var(--color-balance)"} />
                ))}
                <LabelList dataKey="balance" content={BalanceLabel} />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default CashByAccountChart;
