"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { getEmployeeTransactions } from "@/services/employee.services";

export const RECENT_PAYOUTS_QUERY = "page=1&limit=5&sortBy=date&sortOrder=desc";

/** The last few salary and bonus payments, read-only. */
const RecentPayouts = () => {
  const { data } = useQuery({
    queryKey: ["employee-payouts", RECENT_PAYOUTS_QUERY],
    queryFn: () => getEmployeeTransactions(RECENT_PAYOUTS_QUERY),
  });

  const payouts = data?.data.transactions ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Recent payouts</CardTitle>
          <CardDescription>The last five salary and bonus payments.</CardDescription>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/employees/transactions">All transactions</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {payouts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No payouts yet.</p>
        ) : (
          <ul className="divide-y">
            {payouts.map((payout) => (
              <li key={payout.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{payout.employee.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {payout.type === "BONUS" ? "Bonus" : "Salary"} · {formatDate(payout.date)}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatCurrency(toNumber(payout.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentPayouts;
