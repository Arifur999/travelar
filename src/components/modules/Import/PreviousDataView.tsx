"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileSpreadsheet, PlayCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  previewImportAction,
  startImportAction,
} from "@/app/(dashboardLayout)/dashboard/previous-data/_action";
import Loader from "@/components/shared/Loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { type IImportPreview, type IImportRun, type ITabPreview } from "@/types/import.types";
import ImportHistory from "./ImportHistory";
import ImportRunProgress from "./ImportRunProgress";

/**
 * What the API itself will take, so an oversized file is refused here with a
 * sentence rather than by a proxy with a status code.
 */
const MAX_FILE_BYTES = 15 * 1024 * 1024;

/**
 * Says what went wrong when the upload never reached the API at all.
 *
 * A server action that fails outside our own code — the request too large for
 * the limit in next.config.ts, or the connection dropped — rejects rather than
 * returning, and the first version of this screen let that rejection go
 * nowhere: the button stopped spinning and nothing else happened, which is the
 * worst thing a page can do with somebody's whole business.
 */
const uploadFailureMessage = (error: unknown, file: File | undefined) => {
  if (file && file.size > MAX_FILE_BYTES) {
    return "That file is too big to upload. Split the sheet, or ask us to raise the limit.";
  }
  return error instanceof Error && error.message
    ? `The upload did not get through: ${error.message}`
    : "The upload did not get through. Check your connection and try again.";
};

/** The headline counts, in the order someone setting up would want them. */
const CREATED_LABELS: { key: keyof IImportPreview["wouldCreate"]; label: string }[] = [
  { key: "accounts", label: "Cash & bank accounts" },
  { key: "expenseCategories", label: "Expense categories" },
  { key: "airlines", label: "Airlines" },
  { key: "suppliers", label: "Suppliers" },
  { key: "customers", label: "Customers" },
  { key: "tickets", label: "Air tickets" },
  { key: "ticketPayments", label: "Payments on tickets" },
  { key: "collections", label: "Collections" },
  { key: "supplierPayments", label: "Supplier payments" },
  { key: "expenses", label: "Expenses" },
  { key: "capitalFlows", label: "Investment & withdrawals" },
  { key: "profitWithdrawals", label: "Profit withdrawals" },
];

const TabReport = ({ tab }: { tab: ITabPreview }) => {
  const unreadable = tab.dataRows - tab.readyRows;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{tab.title ?? tab.tab}</CardTitle>
          <Badge variant="outline">{tab.tab}</Badge>
          {unreadable > 0 ? (
            <Badge variant="outline" className="border-warning/40 text-warning">
              {formatNumber(unreadable)} need attention
            </Badge>
          ) : (
            <Badge variant="outline" className="border-success/40 text-success">
              All rows readable
            </Badge>
          )}
        </div>
        <CardDescription>
          {formatNumber(tab.readyRows)} of {formatNumber(tab.dataRows)} rows ready
          {tab.creates ? ` · ${tab.creates}` : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {Object.keys(tab.totals).length > 0 && (
          <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/30 p-3 text-sm">
            {Object.entries(tab.totals).map(([field, total]) => (
              <div key={field}>
                <p className="text-xs text-muted-foreground">{field}</p>
                <p className="font-medium tabular-nums">{formatCurrency(total)}</p>
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Columns found</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(tab.mapped).map(([field, column]) => (
              <Badge key={field} variant="outline" className="font-normal">
                {field} <span className="mx-1 text-muted-foreground">←</span> {column}
              </Badge>
            ))}
          </div>
        </div>

        {tab.unmapped.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              No column found for
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tab.unmapped.map((field) => (
                <Badge key={field} variant="outline" className="border-warning/40 font-normal text-warning">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {tab.problems.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium">Row</th>
                  <th className="px-3 py-2 text-left font-medium">Field</th>
                  <th className="px-3 py-2 text-left font-medium">What is wrong</th>
                </tr>
              </thead>
              <tbody>
                {tab.problems.map((problem) => (
                  <tr key={`${problem.row}-${problem.field}`} className="border-b last:border-0">
                    {/* The row number is the sheet's own, so the file can be
                        opened at that line and fixed. */}
                    <td className="px-3 py-2 tabular-nums">{problem.row}</td>
                    <td className="px-3 py-2">{problem.field}</td>
                    <td className="px-3 py-2 text-muted-foreground">{problem.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Upload the old spreadsheet and read it.
 *
 * Reading and importing are deliberately two steps: the file is somebody's
 * whole business, and a report you can check beats an import you cannot undo.
 */
const PreviousDataView = () => {
  const [preview, setPreview] = useState<IImportPreview | null>(null);
  const [watching, setWatching] = useState<string | null>(null);
  const [alreadyIn, setAlreadyIn] = useState<IImportRun | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (formData: FormData) => previewImportAction(formData),
  });

  const { mutateAsync: startImport, isPending: isStarting } = useMutation({
    mutationFn: (formData: FormData) => startImportAction(formData),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const file = inputRef.current?.files?.[0];
    if (file && file.size > MAX_FILE_BYTES) {
      toast.error(uploadFailureMessage(null, file));
      return;
    }

    const form = new FormData(event.currentTarget);

    let result;
    try {
      result = await mutateAsync(form);
    } catch (error: unknown) {
      toast.error(uploadFailureMessage(error, file));
      return;
    }

    if (!result.success) {
      toast.error(result.message || "Could not read that file");
      return;
    }

    setPreview(result.data);
    setAlreadyIn(null);
    toast.success(`Read ${result.data.filename}`);
  };

  /**
   * Starts the run and hands over to the progress card.
   *
   * The second argument is the second press: the same workbook is refused once,
   * because uploading it twice is nearly always a mistake, and allowed when the
   * answer to "are you sure" is yes.
   */
  const handleImport = async (force: boolean) => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose the .xlsx file you exported from your sheet");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error(uploadFailureMessage(null, file));
      return;
    }

    const body = new FormData();
    body.append("file", file);
    if (force) body.append("force", "true");

    let result;
    try {
      result = await startImport(body);
    } catch (error: unknown) {
      toast.error(uploadFailureMessage(error, file));
      return;
    }

    if (!result.success) {
      toast.error(result.message || "Could not start the import");
      return;
    }

    if (result.data.alreadyImported) {
      setAlreadyIn(result.data.alreadyImported);
      setWatching(null);
      return;
    }

    setAlreadyIn(null);
    setWatching(result.data.importId);
    toast.success("Bringing your spreadsheet in");
  };

  /** The run has finished: everything else on the dashboard is now stale. */
  const handleSettled = async () => {
    await queryClient.invalidateQueries({ queryKey: ["import-runs"] });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bring your old spreadsheet</CardTitle>
          <CardDescription>
            Export your Google Sheet as Microsoft Excel (.xlsx) and upload it here. This reads the
            file and tells you what is in it — nothing is imported yet.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="file">Spreadsheet</Label>
              <Input
                ref={inputRef}
                id="file"
                name="file"
                type="file"
                accept=".xlsx"
                required
                disabled={isPending || isStarting}
                className="w-full sm:w-96"
              />
            </div>

            <Button type="submit" variant="outline" disabled={isPending || isStarting}>
              <Upload className="size-4" aria-hidden="true" />
              {isPending ? "Reading..." : "Read the file"}
            </Button>

            {/* Reading first is a good idea, not a rule: an agency that knows
                its own sheet should not have to read a report to get in. */}
            <Button
              type="button"
              onClick={() => handleImport(false)}
              disabled={isPending || isStarting}
            >
              <PlayCircle className="size-4" aria-hidden="true" />
              {isStarting ? "Starting..." : "Import everything"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isPending && (
        <div className="flex h-32 items-center justify-center">
          <Loader size={28} label="Reading the spreadsheet" />
        </div>
      )}

      {alreadyIn && (
        <Card className="border-info/40">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="size-5 text-info" aria-hidden="true" />
              <CardTitle className="text-base">This spreadsheet is already in</CardTitle>
            </div>
            <CardDescription>
              {/* The same file twice is the commonest mistake here: a second
                  click, or a second person not knowing the first had done it. */}
              You brought <strong>{alreadyIn.filename}</strong> in on{" "}
              {formatDateTime(alreadyIn.createdAt)}. Importing it again would find every row
              already there and add nothing.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => setWatching(alreadyIn.id)}>
              See what it brought in
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isStarting}
              onClick={() => handleImport(true)}
            >
              Import it again anyway
            </Button>
          </CardContent>
        </Card>
      )}

      {watching && (
        <ImportRunProgress key={watching} importId={watching} onSettled={handleSettled} />
      )}

      <ImportHistory onSelect={setWatching} />

      {preview && !isPending && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="size-5 text-primary" aria-hidden="true" />
                <CardTitle>What this file would bring in</CardTitle>
              </div>
              <CardDescription>
                Read from {preview.filename}. Check these against your sheet before importing.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {CREATED_LABELS.map(({ key, label }) => (
                  <div key={key} className="rounded-lg border p-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-xl font-semibold tabular-nums">
                      {formatNumber(preview.wouldCreate[key])}
                    </dd>
                  </div>
                ))}
              </dl>

              {preview.skipped.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  {/* These are the sheet's own dashboards. This app works the
                      same figures out from the rows it imports, so importing
                      them would be importing the same opinion twice. */}
                  Left alone, because they are reports rather than data:{" "}
                  {preview.skipped.join(", ")}.
                </p>
              )}
            </CardContent>
          </Card>

          {preview.tabs.map((tab) => (
            <TabReport key={tab.tab} tab={tab} />
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm">
              Nothing has been imported yet. When the figures above look right, bring it all in:
              accounts, categories, airlines, routes and suppliers first, then customers, then the
              history on top.
            </p>
            <Button type="button" onClick={() => handleImport(false)} disabled={isStarting}>
              <PlayCircle className="size-4" aria-hidden="true" />
              {isStarting ? "Starting..." : "Import everything"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PreviousDataView;
