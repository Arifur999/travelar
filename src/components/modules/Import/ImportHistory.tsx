"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { History, RefreshCw, Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  getImportRunsAction,
  revertImportAction,
} from "@/app/(dashboardLayout)/dashboard/previous-data/_action";
import { isStaleServerAction, STALE_PAGE_MESSAGE } from "@/lib/actionError";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Loader from "@/components/shared/Loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatNumber } from "@/lib/format";
import { type IImportRun } from "@/types/import.types";

const STATUS_STYLES: Record<IImportRun["status"], { label: string; className: string }> = {
  RUNNING: { label: "Running", className: "border-info/40 text-info" },
  COMPLETED: { label: "Imported", className: "border-success/40 text-success" },
  FAILED: { label: "Stopped", className: "border-destructive/40 text-destructive" },
  REVERTED: { label: "Undone", className: "border-muted-foreground/40 text-muted-foreground" },
};

const STAGE_LABELS: Record<IImportRun["stage"], string> = {
  EVERYTHING: "Lists and history",
  FOUNDATIONS: "Lists only",
  HISTORY: "History only",
};

/** The few counts worth showing on one line of a list. */
const summarise = (counts: Record<string, number>) => {
  const parts = [
    ["customers", "customers"],
    ["tickets", "tickets"],
    ["suppliers", "suppliers"],
    ["expenses", "expenses"],
  ]
    .map(([key, word]) => (counts[key] ? `${formatNumber(counts[key])} ${word}` : null))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Nothing new";
};

interface ImportHistoryProps {
  onSelect?: (importId: string) => void;
  /**
   * True while the card above is already following the running import.
   *
   * Only one import can run at a time, so when that card is polling there is
   * nothing here worth asking for a second time: two polls of the same run
   * meant roughly three API calls a second from one open tab, every one of
   * them a Server Action that makes the proxy fetch the session as well.
   */
  liveElsewhere?: boolean;
}

/**
 * Every upload this agency has made, and the way back out of any of them.
 *
 * An import nobody can reverse is an import nobody dares run on real books, so
 * this is not a log — it is the undo button, with the date beside it.
 */
const ImportHistory = ({ onSelect, liveElsewhere }: ImportHistoryProps) => {
  const [undoing, setUndoing] = useState<IImportRun | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: runs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["import-runs"],
    queryFn: async () => {
      const result = await getImportRunsAction();
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    // While one is still going, its row has to keep up with it — unless the
    // card above is already watching that same run.
    refetchInterval: (query) =>
      !liveElsewhere && query.state.data?.some((run) => run.status === "RUNNING") ? 4000 : false,
  });

  const { mutateAsync: undo, isPending } = useMutation({
    mutationFn: (importId: string) => revertImportAction(importId),
  });

  const handleUndo = async () => {
    if (!undoing) return;

    const undoneId = undoing.id;

    let result;
    try {
      result = await undo(undoneId);
    } catch (error: unknown) {
      // The action itself failed rather than answering — a page left open
      // across a release, or a dropped connection. Without this the dialog sat
      // there with its button live and nothing said, and the obvious thing to
      // do was press it again.
      if (isStaleServerAction(error)) {
        toast.error(STALE_PAGE_MESSAGE, {
          duration: 15_000,
          action: { label: "Reload", onClick: () => window.location.reload() },
        });
      } else {
        toast.error("Could not undo that import — nothing was changed. Try again.");
      }
      return;
    }

    if (!result.success) {
      toast.error(result.message || "Could not undo that import");
      return;
    }

    toast.success("That import was taken back out");
    setUndoing(null);
    await queryClient.invalidateQueries({ queryKey: ["import-runs"] });
    await queryClient.refetchQueries({ queryKey: ["import-runs"], type: "active" });
    // The card above may be showing this very run as "Everything is in".
    await queryClient.invalidateQueries({ queryKey: ["import-run", undoneId] });
    // Everything else on the dashboard was reading those rows.
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader size={24} label="Loading your imports" />
      </div>
    );
  }

  // An empty history and a history that could not be read look the same to a
  // component that renders nothing for both — and this table is the only way
  // back out of an import, so its absence has to be explained.
  if (error) {
    return (
      <Card className="border-warning/40">
        <CardHeader>
          <CardTitle className="text-base">Cannot show your earlier uploads</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : "The server did not answer."} Nothing has
            been lost — this is the list, not the imports themselves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!runs || runs.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="size-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base">What you have uploaded before</CardTitle>
          </div>
          <CardDescription>
            Every upload, when it happened and what it brought in. Any of them can be taken back
            out, as long as nothing new has been booked against it.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium">When</th>
                  <th className="px-3 py-2 text-left font-medium">File</th>
                  <th className="px-3 py-2 text-left font-medium">What it brought in</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Undo</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const badge = STATUS_STYLES[run.status];

                  return (
                    <tr key={run.id} className="border-b last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatDateTime(run.createdAt)}
                        {run.revertedAt && (
                          <span className="block text-xs text-muted-foreground">
                            undone {formatDateTime(run.revertedAt)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => onSelect?.(run.id)}
                          className="text-left underline-offset-2 hover:underline"
                        >
                          {run.filename}
                        </button>
                        <span className="block text-xs text-muted-foreground">
                          {STAGE_LABELS[run.stage]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{summarise(run.counts)}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={badge.className}>
                          {badge.label}
                          {run.status === "RUNNING" && run.progress
                            ? ` ${run.progress.percent}%`
                            : ""}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          // A run that is still writing cannot be unwound
                          // underneath itself, and one already undone has
                          // nothing left to take out.
                          disabled={run.status === "RUNNING" || run.status === "REVERTED"}
                          onClick={() => setUndoing(run)}
                        >
                          <Undo2 className="size-4" aria-hidden="true" />
                          Undo
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={undoing !== null}
        onOpenChange={(open) => !open && setUndoing(null)}
        onConfirm={handleUndo}
        isPending={isPending}
        title="Undo this import?"
        confirmLabel="Undo the import"
        pendingLabel="Undoing..."
        description={
          <>
            <p>
              Everything <strong>{undoing?.filename}</strong> brought in will be removed, along with
              the money it put on your accounts.
            </p>
            <p className="mt-2">
              Nothing you entered yourself is touched. If you have already booked something against
              an imported customer or supplier, this will stop and say so instead.
            </p>
          </>
        }
      />
    </>
  );
};

export default ImportHistory;
