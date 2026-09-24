"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiRefreshLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { getImportRunAction } from "@/app/(dashboardLayout)/dashboard/previous-data/_action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import { type IImportRun } from "@/types/import.types";

/** Everything a run can create, in the order someone setting up thinks of it. */
const COUNT_LABELS: [string, string][] = [
  ["accounts", "Cash & bank accounts"],
  ["expenseCategories", "Expense categories"],
  ["airlines", "Airlines"],
  ["routes", "Routes"],
  ["suppliers", "Suppliers"],
  ["customers", "Customers"],
  ["tickets", "Air tickets"],
  ["ticketPayments", "Payments on tickets"],
  ["dateChanges", "Date changes"],
  ["collections", "Collections"],
  ["supplierPayments", "Supplier payments"],
  ["expenses", "Expenses"],
  ["capitalFlows", "Investment & withdrawals"],
  ["profitWithdrawals", "Profit withdrawals"],
];

/** The figures worth putting next to the ones the spreadsheet prints itself. */
const TOTAL_LABELS: [string, string][] = [
  ["cost", "Total buying"],
  ["fare", "Total selling"],
  // Both sides of a date change, because profit counts them and a panel whose
  // own figures do not add up is worse than one that shows fewer of them:
  // profit = selling + change fee − buying − change cost.
  ["dateChangeCost", "Date change cost"],
  ["dateChangeFee", "Date change fee"],
  ["profit", "Profit"],
  ["ticketPayments", "Taken on tickets"],
  ["collections", "Collected"],
  ["supplierPayments", "Paid to suppliers"],
  ["expenses", "Expenses"],
  ["invested", "Invested"],
  ["withdrawn", "Withdrawn"],
  ["profitWithdrawn", "Profit withdrawn"],
];

const ProgressBar = ({ percent }: { percent: number }) => (
  // A plain bar rather than a primitive: it is one element, and the only
  // behaviour it has is the width.
  <div
    role="progressbar"
    aria-valuenow={percent}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label="Import progress"
    className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
  >
    <div
      className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
      style={{ width: `${Math.max(percent, 2)}%` }}
    />
  </div>
);

interface ImportRunProgressProps {
  importId: string;
  /** Called once, when the run stops being RUNNING. */
  onSettled?: (run: IImportRun) => void;
}

/**
 * Watches one import and shows how far it has got.
 *
 * The run does not happen inside any request, so there is nothing to wait on:
 * this asks the API where it is up to, about once a second, and stops asking
 * the moment it is no longer running. That is also why it survives a reload —
 * the progress lives on the run, not in this component.
 */
const ImportRunProgress = ({ importId, onSettled }: ImportRunProgressProps) => {
  const { data: run, error, refetch } = useQuery({
    queryKey: ["import-run", importId],
    queryFn: async () => {
      const result = await getImportRunAction(importId);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    // Only while there is something to watch. A finished run never changes
    // again, so polling it would be asking the same question for ever.
    refetchInterval: (query) => (query.state.data?.status === "RUNNING" ? 1200 : false),
    refetchOnWindowFocus: false,
  });

  // Whether this card has watched the run go. Opening a finished import from
  // the history is not the import finishing, and treating it as one refreshed
  // the whole dashboard every time somebody looked back at an old run.
  const wasRunning = useRef(false);

  useEffect(() => {
    if (!run) return;

    if (run.status === "RUNNING") {
      wasRunning.current = true;
      return;
    }

    if (wasRunning.current) {
      wasRunning.current = false;
      onSettled?.(run);
    }
    // Once per run, when it stops: re-running on every render would refetch
    // the rest of the dashboard on a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id, run?.status]);

  // A run that cannot be read is not a run that is not there. Rendering
  // nothing would leave somebody who was just told the import had started
  // looking at an empty page — which is the thing this card exists to stop.
  if (error) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <RiCloseCircleLine className="size-5 text-destructive" aria-hidden="true" />
            <CardTitle className="text-base">Cannot tell how the import is going</CardTitle>
          </div>
          <CardDescription>
            {error instanceof Error ? error.message : "The server did not answer."} The import
            itself is not affected — it runs on the server, not in this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            <RiRefreshLine className="size-4" aria-hidden="true" />
            Check again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Nothing yet on the very first fetch; the toast already said it started.
  if (!run) return null;

  if (run.status === "RUNNING") {
    const progress = run.progress;
    const percent = progress?.percent ?? 0;

    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-base">Bringing your spreadsheet in</CardTitle>
          <CardDescription>
            {progress
              ? `Step ${progress.stepNumber} of ${progress.stepCount} · ${progress.step}`
              : "Getting started"}
            {progress && progress.total > 0
              ? ` — ${formatNumber(progress.done)} of ${formatNumber(progress.total)} rows`
              : ""}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          <ProgressBar percent={percent} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{run.filename}</span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {/* True, and worth saying: the work is on the server, so closing
                the tab does not stop it. */}
            This keeps going whether or not you stay on this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (run.status === "FAILED") {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <RiCloseCircleLine className="size-5 text-destructive" aria-hidden="true" />
            <CardTitle className="text-base">The import stopped</CardTitle>
          </div>
          <CardDescription>{run.note ?? "Something went wrong part of the way through."}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            What it managed to bring in is still listed below and can be undone. Fix the sheet and
            upload it again — a second run skips everything the first one already brought in.
          </p>
        </CardContent>
      </Card>
    );
  }

  const counts = COUNT_LABELS.filter(([key]) => (run.counts[key] ?? 0) > 0);
  const totals = TOTAL_LABELS.filter(([key]) => run.result?.totals?.[key] !== undefined);
  const problems = run.result?.problems ?? [];
  // The API keeps every problem in the count but only sends the first hundred,
  // so the list's length would under-report a sheet with thousands of bad rows
  // — on the one screen whose job is reconciling the books against it.
  const problemCount = run.counts.problems ?? problems.length;
  const skipped = Object.entries(run.result?.skipped ?? {}).filter(([, value]) => value > 0);

  return (
    <Card className="border-success/40">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <RiCheckboxCircleLine className="size-5 text-success" aria-hidden="true" />
          <CardTitle className="text-base">
            {run.status === "REVERTED" ? "This import was undone" : "Everything is in"}
          </CardTitle>
          <Badge variant="outline">{run.filename}</Badge>
        </div>
        <CardDescription>
          Check these against the figures at the top of your own sheet. They should match.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {counts.length > 0 && (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {counts.map(([key, label]) => (
              <div key={key} className="rounded-lg border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {formatNumber(run.counts[key])}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {totals.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              What that adds up to
            </p>
            <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/30 p-3 text-sm">
              {totals.map(([key, label]) => (
                <div key={key}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium tabular-nums">
                    {formatCurrency(run.result?.totals?.[key])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {skipped.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {/* Not an error: the same file run twice, or a row fixed and the
                sheet uploaded again. */}
            Already in the books, so left alone:{" "}
            {skipped.map(([key, value]) => `${formatNumber(value)} ${key}`).join(", ")}.
          </p>
        )}

        {problems.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-start gap-2 text-sm">
              <RiAlertLine className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              <span>
                {formatNumber(problemCount)} {problemCount === 1 ? "row was" : "rows were"} left
                out. Fix them in the sheet and upload it again — everything already in stays as it
                is.
                {problemCount > problems.length
                  ? ` The first ${formatNumber(problems.length)} are listed below.`
                  : ""}
              </span>
            </p>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Sheet</th>
                    <th className="px-3 py-2 text-left font-medium">Row</th>
                    <th className="px-3 py-2 text-left font-medium">What is wrong</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((problem, index) => (
                    <tr key={`${problem.tab}-${problem.row}-${index}`} className="border-b last:border-0">
                      <td className="px-3 py-2">{problem.tab}</td>
                      {/* The sheet's own row number, so the file can be opened
                          at that line and fixed. */}
                      <td className="px-3 py-2 tabular-nums">{problem.row}</td>
                      <td className="px-3 py-2 text-muted-foreground">{problem.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportRunProgress;
