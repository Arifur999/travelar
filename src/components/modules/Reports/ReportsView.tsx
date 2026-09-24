"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RiArrowDownCircleLine,
  RiArrowUpCircleLine,
  RiCalendarLine,
  RiWallet3Line,
} from "@remixicon/react";
import Loader from "@/components/shared/Loader";
import StatsCard from "@/components/shared/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import MonthlyGoalChart from "./MonthlyGoalChart";
import {
  getCashFlow,
  getCustomDashboard,
  getMonthlyDashboard,
  getYearlyDashboard,
} from "@/services/dashboard.services";
import { MONTH_NAMES } from "@/types/dashboard.types";
import OverviewPanel from "./OverviewPanel";

type Scope = "monthly" | "yearly" | "custom";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - 4 + index);

/**
 * Three scopes over one overview shape, plus the cash-flow reconciliation.
 *
 * Scope lives in local state rather than the URL: this page has no table, so
 * there is nothing to keep in step with pagination, and a shareable link to
 * "March 2026" is not a requirement anyone has.
 */
const ReportsView = () => {
  const [scope, setScope] = useState<Scope>("monthly");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string } | null>(null);

  const monthly = useQuery({
    queryKey: ["dashboard-monthly", year, month],
    queryFn: () => getMonthlyDashboard(year, month),
    enabled: scope === "monthly",
  });

  const yearly = useQuery({
    queryKey: ["dashboard-yearly", year],
    queryFn: () => getYearlyDashboard(year),
    enabled: scope === "yearly",
  });

  const custom = useQuery({
    queryKey: ["dashboard-custom", appliedRange?.from, appliedRange?.to],
    queryFn: () => getCustomDashboard(appliedRange?.from, appliedRange?.to),
    enabled: scope === "custom" && appliedRange !== null,
  });

  const cashFlow = useQuery({
    queryKey: ["dashboard-cash-flow"],
    queryFn: () => getCashFlow(),
  });

  const active =
    scope === "monthly" ? monthly : scope === "yearly" ? yearly : custom;
  const overview = active.data?.data;
  const flow = cashFlow.data?.data;

  return (
    <div className="space-y-6">
      {/* Cash position — the same reconciliation the spreadsheet's Cash Flow
          tab does, and independent of the period being viewed. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="In accounts"
          value={formatCurrency(flow?.accountBalance ?? 0)}
          icon={RiWallet3Line}
          accent="primary"
        />
        <StatsCard
          title="Owed to you"
          value={formatCurrency(flow?.customerDue ?? 0)}
          icon={RiArrowUpCircleLine}
          accent="success"
          hint={flow ? `${formatCurrency(flow.totalAssets)} total assets` : undefined}
        />
        <StatsCard
          title="You owe"
          value={formatCurrency(flow?.supplierPayable ?? 0)}
          icon={RiArrowDownCircleLine}
          accent="destructive"
        />
        <StatsCard
          title="Net position"
          value={formatCurrency(flow?.netCashFlow ?? 0)}
          icon={RiWallet3Line}
          accent="ledger"
          hint={
            flow
              ? `${formatCurrency(flow.difference)} beyond owners' capital`
              : undefined
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Period</CardTitle>
          <CardDescription>The same figures at three different scopes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["monthly", "yearly", "custom"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={scope === value ? "default" : "outline"}
                onClick={() => setScope(value)}
              >
                {value === "monthly" ? "Monthly" : value === "yearly" ? "Yearly" : "Custom range"}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {scope !== "custom" && (
              <div className="space-y-1.5">
                <Label htmlFor="report-year">Year</Label>
                <Select value={String(year)} onValueChange={(next) => setYear(Number(next))}>
                  <SelectTrigger id="report-year" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scope === "monthly" && (
              <div className="space-y-1.5">
                <Label htmlFor="report-month">Month</Label>
                <Select value={String(month)} onValueChange={(next) => setMonth(Number(next))}>
                  <SelectTrigger id="report-month" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, index) => (
                      <SelectItem key={name} value={String(index + 1)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scope === "custom" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="report-from">From</Label>
                  <Input
                    id="report-from"
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="report-to">To</Label>
                  <Input
                    id="report-to"
                    type="date"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    className="w-40"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => setAppliedRange({ from, to })}
                  disabled={!from || !to || from > to}
                >
                  <RiCalendarLine className="size-4" aria-hidden="true" />
                  Apply
                </Button>
                {from && to && from > to && (
                  <p className="w-full text-xs text-destructive">
                    The start date is after the end date.
                  </p>
                )}
              </>
            )}
          </div>

          {scope === "custom" && appliedRange === null && (
            <p className="text-sm text-muted-foreground">
              Pick a range and apply it. Leaving it blank would default to this month, which the
              Monthly tab already covers.
            </p>
          )}
        </CardContent>
      </Card>

      {active.isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader size={32} label="Loading report" />
        </div>
      ) : overview ? (
        <>
          <OverviewPanel overview={overview} />

          {/* Month by month, yearly scope only. */}
          {scope === "yearly" && yearly.data && (
            <MonthlyGoalChart months={yearly.data.data.months} />
          )}

          {scope === "yearly" && yearly.data && (
            <Card>
              <CardHeader>
                <CardTitle>Month by month</CardTitle>
                <CardDescription>Sales, profit and spending across {year}.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left font-medium">Month</th>
                        <th className="px-3 py-2 text-right font-medium">Sales</th>
                        <th className="px-3 py-2 text-right font-medium">Profit</th>
                        <th className="px-3 py-2 text-right font-medium">Expenses</th>
                        <th className="px-3 py-2 text-right font-medium">P / L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearly.data.data.months.map((row) => (
                        <tr key={row.month} className="border-b last:border-0">
                          <td className="px-3 py-2 whitespace-nowrap">{row.monthName}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatCurrency(row.actualSales)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatCurrency(row.actualProfit)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatCurrency(row.expenses)}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-medium tabular-nums",
                              row.profitLoss >= 0 ? "text-success" : "text-destructive",
                            )}
                          >
                            {formatCurrency(row.profitLoss)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* The full reconciliation, spelled out. */}
          {flow && (
            <Card>
              <CardHeader>
                <CardTitle>Cash flow</CardTitle>
                <CardDescription>
                  What is in the accounts, plus what customers owe, less what you owe suppliers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="max-w-md text-sm">
                  <div className="flex justify-between py-1">
                    <dt className="text-muted-foreground">Account balances</dt>
                    <dd className="tabular-nums">{formatCurrency(flow.accountBalance)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-muted-foreground">Customer due</dt>
                    <dd className="tabular-nums">+ {formatCurrency(flow.customerDue)}</dd>
                  </div>
                  <div className="flex justify-between border-t py-1 pt-2 font-medium">
                    <dt>Total assets</dt>
                    <dd className="tabular-nums">{formatCurrency(flow.totalAssets)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-muted-foreground">Supplier payable</dt>
                    <dd className="tabular-nums text-destructive">
                      − {formatCurrency(flow.supplierPayable)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t py-1 pt-2 font-medium">
                    <dt>Net cash flow</dt>
                    <dd className="tabular-nums">{formatCurrency(flow.netCashFlow)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-muted-foreground">Net owner capital</dt>
                    <dd className="tabular-nums">− {formatCurrency(flow.netInvestment)}</dd>
                  </div>
                  <div className="flex justify-between border-t py-1 pt-2 font-medium">
                    <dt>Generated by the business</dt>
                    <dd
                      className={cn(
                        "tabular-nums",
                        flow.difference >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {formatCurrency(flow.difference)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  {formatCurrency(flow.invested)} invested and{" "}
                  {formatCurrency(flow.withdrawn)} withdrawn by owners to date.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : scope === "custom" ? null : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing to report for this period.
        </p>
      )}
    </div>
  );
};

export default ReportsView;
