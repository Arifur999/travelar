"use client";

import { useQuery } from "@tanstack/react-query";
import Loader from "@/components/shared/Loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getAccountsOverview } from "@/services/account.services";
import { POSTING_SOURCE_LABELS, type PostingSource } from "@/types/enums.types";

/**
 * Column order follows the source spreadsheet's Balance Dashboard, so an
 * agency that worked from that sheet reads this left to right the same way.
 *
 * OPENING is first because it is where each account starts; TRANSFER_IN /
 * TRANSFER_OUT sit at the end because they net to zero across the agency and
 * are the one pair that never changes the total.
 */
const SOURCE_ORDER: PostingSource[] = [
  "OPENING",
  "INVESTMENT",
  "INVESTMENT_WITHDRAWAL",
  "PROFIT_WITHDRAWAL",
  "SALES_PAYMENT",
  "DUE_RECEIVED",
  "DATE_CHANGE_FEE",
  "SUPPLIER_PAYMENT",
  "EXPENSE",
  "EMPLOYEE_PAYOUT",
  "ADJUSTMENT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
];

const SignedAmount = ({ value }: { value: number }) => {
  if (value === 0) {
    // 0, not a dash: an account that drew nothing from this source drew zero,
    // and a money column with gaps in it is harder to read down.
    return <span className="tabular-nums text-muted-foreground/60">{formatCurrency(0)}</span>;
  }

  return (
    <span className={cn("tabular-nums", value > 0 ? "text-success" : "text-destructive")}>
      {formatCurrency(value)}
    </span>
  );
};

/**
 * One row per account, one column per money source, every figure derived from
 * the same posting ledger.
 *
 * This is the whole point of the single-ledger design: the row total and the
 * account's own balance are the same number by construction, so the two can
 * never disagree the way a stored balance and a re-derived one did before.
 */
const BalanceDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["accounts-overview"],
    queryFn: () => getAccountsOverview(),
  });

  const rows = data?.data.data ?? [];
  const summary = data?.data.summary;

  // Only render columns that actually carry a posting somewhere — all thirteen
  // would be unreadable on an agency that just started.
  const activeSources = SOURCE_ORDER.filter((source) =>
    rows.some((row) => (row.bySource[source] ?? 0) !== 0),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance dashboard</CardTitle>
        <CardDescription>
          Every movement on every account, grouped by what caused it. Each row adds up to that
          account&apos;s balance, because both come from the same ledger.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader size={28} label="Loading balance dashboard" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No accounts yet. Add one above and its movements will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="sticky left-0 bg-card px-3 py-2 text-left font-medium whitespace-nowrap">
                    Account
                  </th>
                  {activeSources.map((source) => (
                    <th
                      key={source}
                      className="px-3 py-2 text-right font-medium whitespace-nowrap text-muted-foreground"
                    >
                      {POSTING_SOURCE_LABELS[source]}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Balance</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="sticky left-0 bg-card px-3 py-2 whitespace-nowrap">
                      <span className={cn("font-medium", !row.isActive && "text-muted-foreground")}>
                        {row.name}
                      </span>
                      {!row.isActive && (
                        <span className="ml-1 text-xs text-muted-foreground">(archived)</span>
                      )}
                    </td>

                    {activeSources.map((source) => (
                      <td key={source} className="px-3 py-2 text-right">
                        <SignedAmount value={row.bySource[source] ?? 0} />
                      </td>
                    ))}

                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {formatCurrency(row.currentBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="border-t-2">
                  <td className="sticky left-0 bg-card px-3 py-2 font-medium">Total</td>
                  {activeSources.map((source) => (
                    <td key={source} className="px-3 py-2 text-right">
                      <SignedAmount
                        value={rows.reduce((sum, row) => sum + (row.bySource[source] ?? 0), 0)}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {/* Every account, archived included — this is the ledger
                        total, not the headline figure, which counts only
                        active accounts. */}
                    {formatCurrency(rows.reduce((sum, row) => sum + row.currentBalance, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>

            {summary && summary.inactiveBalance !== 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                {formatCurrency(summary.inactiveBalance)} of that sits in archived accounts and
                is excluded from the headline balance above.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceDashboard;
