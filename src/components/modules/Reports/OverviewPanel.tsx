"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateMarginPercent,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { type IDashboardOverview } from "@/types/dashboard.types";

/**
 * The same figures the source spreadsheet shows on its Custom, Monthly and
 * Yearly dashboards — one component, three scopes.
 */
const OverviewPanel = ({ overview }: { overview: IDashboardOverview }) => {
  const { byModule } = overview;
  const margin = calculateMarginPercent(overview.actualProfit, overview.actualSales);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>What the period actually added to the business.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="text-sm">
            <div className="flex justify-between py-1">
              <dt className="text-muted-foreground">Sales</dt>
              <dd className="tabular-nums">{formatCurrency(overview.actualSales)}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-muted-foreground">Gross profit</dt>
              <dd className="tabular-nums">
                {formatCurrency(overview.actualProfit)}
                {margin !== null && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({formatPercent(margin)})
                  </span>
                )}
              </dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-muted-foreground">Expenses</dt>
              <dd className="tabular-nums text-destructive">
                − {formatCurrency(overview.expenses)}
              </dd>
            </div>
            <div className="flex justify-between border-t py-1 pt-2 font-medium">
              <dt>Profit / loss</dt>
              <dd
                className={cn(
                  "tabular-nums",
                  overview.profitLoss >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {formatCurrency(overview.profitLoss)}
              </dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-muted-foreground">Profit withdrawn</dt>
              <dd className="tabular-nums">− {formatCurrency(overview.profitWithdraw)}</dd>
            </div>
            <div className="flex justify-between border-t py-1 pt-2 font-medium">
              <dt>Increase / decrease</dt>
              <dd
                className={cn(
                  "tabular-nums",
                  overview.increaseOrDecrease >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {formatCurrency(overview.increaseOrDecrease)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By module</CardTitle>
          <CardDescription>Where the sales and the margin came from.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium">Module</th>
                  <th className="px-3 py-2 text-right font-medium">Count</th>
                  <th className="px-3 py-2 text-right font-medium">Sales</th>
                  <th className="px-3 py-2 text-right font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-3 py-2 font-medium">Ticketing</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumber(byModule.ticketing.count)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(byModule.ticketing.sales)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(byModule.ticketing.profit)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-3 py-2 font-medium">Visa</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumber(byModule.visa.count)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(byModule.visa.sales)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(byModule.visa.profit)}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Hajj &amp; Umrah</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumber(byModule.hajj.count)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(byModule.hajj.sales)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {/* null, not zero: a booking records no cost, so there is
                        no margin to report. Showing 0 would read as "made
                        nothing"; showing the sales as profit would overstate
                        it by the cost of every pilgrim. */}
                    <Badge variant="outline" className="text-xs font-normal">
                      not tracked
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Hajj profit is not derivable: a booking records what the pilgrim is charged but not
            what the package costs the agency.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>Income by airline</CardTitle>
            <CardDescription>Ticket sales grouped by carrier.</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.incomeByAirline.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No ticket sales in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">Airline</th>
                      <th className="px-3 py-2 text-right font-medium">Tickets</th>
                      <th className="px-3 py-2 text-right font-medium">Sales</th>
                      <th className="px-3 py-2 text-right font-medium">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.incomeByAirline.map((row) => (
                      <tr
                        key={row.airlineId ?? "unassigned"}
                        className="border-b last:border-0"
                      >
                        <td className="px-3 py-2">
                          {row.shortCode && (
                            <Badge variant="secondary" className="mr-2 font-mono">
                              {row.shortCode}
                            </Badge>
                          )}
                          {row.name}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatNumber(row.count)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(row.sales)}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right tabular-nums",
                            row.profit < 0 && "text-destructive",
                          )}
                        >
                          {formatCurrency(row.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by category</CardTitle>
            <CardDescription>Where the spending went.</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.expenseByCategory.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No expenses in this period.
              </p>
            ) : (
              <ul className="space-y-3">
                {overview.expenseByCategory.map((row) => (
                  <li key={row.categoryId} className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color ?? "var(--muted-foreground)" }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{row.name}</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(row.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-expense"
                        style={{ width: `${Math.min(row.share, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercent(row.share)} of spend
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewPanel;
