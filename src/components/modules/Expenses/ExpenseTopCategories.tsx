"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getExpenseDashboard } from "@/services/expense.services";

const TOP_N = 5;

/**
 * Where the money went, read-only. Budgets and the add/edit controls live on
 * the Category page; this is the dashboard's summary of the same figures.
 */
const ExpenseTopCategories = () => {
  const { data } = useQuery({
    queryKey: ["expense-dashboard"],
    queryFn: () => getExpenseDashboard(),
  });

  const categories = (data?.data.byCategory ?? [])
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, TOP_N);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Where it went</CardTitle>
          <CardDescription>The biggest categories, all time.</CardDescription>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/expenses/categories">Manage categories</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing spent yet. Record an expense and it will show up here.
          </p>
        ) : (
          <ul className="space-y-3">
            {categories.map((category) => (
              <li key={category.id} className="space-y-1">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate">{category.name}</span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatCurrency(category.total)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {formatPercent(category.shareOfTotal)}
                    </span>
                  </span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={Math.round(category.shareOfTotal)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${category.name} share of spending`}
                >
                  <div
                    className="h-full rounded-full bg-expense"
                    style={{ width: `${Math.min(category.shareOfTotal, 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseTopCategories;
