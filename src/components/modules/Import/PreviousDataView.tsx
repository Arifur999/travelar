"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { previewImportAction } from "@/app/(dashboardLayout)/dashboard/previous-data/_action";
import Loader from "@/components/shared/Loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatNumber } from "@/lib/format";
import { type IImportPreview, type ITabPreview } from "@/types/import.types";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (formData: FormData) => previewImportAction(formData),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const result = await mutateAsync(form);

    if (!result.success) {
      toast.error(result.message || "Could not read that file");
      return;
    }

    setPreview(result.data);
    toast.success(`Read ${result.data.filename}`);
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
                disabled={isPending}
                className="w-full sm:w-96"
              />
            </div>

            <Button type="submit" disabled={isPending}>
              <Upload className="size-4" aria-hidden="true" />
              {isPending ? "Reading..." : "Read the file"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isPending && (
        <div className="flex h-32 items-center justify-center">
          <Loader size={28} label="Reading the spreadsheet" />
        </div>
      )}

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

          <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            <span>
              Nothing has been imported. Importing is the next step, and it will go in this order:
              accounts, categories, airlines and suppliers first, then customers, then the history.
            </span>
          </p>
        </>
      )}
    </div>
  );
};

export default PreviousDataView;
