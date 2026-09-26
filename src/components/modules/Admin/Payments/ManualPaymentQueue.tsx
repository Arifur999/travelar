"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiCheckLine, RiCloseLine, RiInboxLine } from "@remixicon/react";
import { toast } from "sonner";
import { reviewManualPaymentAction } from "@/app/(dashboardLayout)/admin/dashboard/payments/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Loader from "@/components/shared/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getManualPayments } from "@/services/admin.services";
import { type IManualPaymentForReview } from "@/types/billing.types";

type Decision = { row: IManualPaymentForReview; approve: boolean };

/**
 * bKash payments agencies say they have made, waiting to be checked.
 *
 * Nothing in this queue is a payment yet — it is a claim, typed off somebody's
 * phone. The operator finds the transaction in their own bKash statement and
 * approves it, which renews the plan there and then. Refusing frees the agency
 * to submit a corrected one.
 */
const ManualPaymentQueue = () => {
  const [decision, setDecision] = useState<Decision | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-manual-payments"],
    queryFn: () => getManualPayments("PENDING"),
    // Somebody is waiting on the other end of every row here.
    refetchInterval: 30_000,
  });

  const rows = data?.data ?? [];

  const { mutateAsync: review, isPending } = useMutation({
    mutationFn: ({ row, approve }: Decision) =>
      reviewManualPaymentAction(row.id, approve),
  });

  const handleConfirm = async () => {
    if (!decision) return;

    let result;
    try {
      result = await review(decision);
    } catch {
      toast.error("Could not record that decision — nothing was changed. Try again.");
      return;
    }

    if (!result.success) {
      toast.error(result.message || "Could not record that decision");
      return;
    }

    toast.success(
      decision.approve ? "Approved — the plan is active now" : "Refused",
    );
    setDecision(null);
    await queryClient.invalidateQueries({ queryKey: ["admin-manual-payments"] });
    // The platform figures on the overview counted this agency as unpaid.
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader size={28} label="Loading bKash payments" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            bKash payments to check
            {rows.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {rows.length}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Find each transaction in your bKash statement before approving. Approving renews the
            plan immediately.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <RiInboxLine className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Nothing waiting. New bKash payments appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="px-3 py-2.5 text-left font-medium">Agency</th>
                      <th className="px-3 py-2.5 text-left font-medium">Plan</th>
                      <th className="px-3 py-2.5 text-left font-medium">Amount</th>
                      <th className="px-3 py-2.5 text-left font-medium">Paid from</th>
                      <th className="px-3 py-2.5 text-left font-medium">Transaction ID</th>
                      <th className="px-3 py-2.5 text-left font-medium">Sent</th>
                      <th className="px-3 py-2.5 text-right font-medium">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b transition-colors last:border-0 hover:bg-muted/40">
                        <td className="px-3 py-3">
                          <p className="font-medium">{row.agency.name}</p>
                          {row.agency.phone && (
                            <p className="text-xs text-muted-foreground">{row.agency.phone}</p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {row.plan.name}
                          <span className="block text-xs text-muted-foreground">
                            {row.plan.durationDays} days
                          </span>
                        </td>
                        <td className="px-3 py-3 font-medium tabular-nums">
                          {formatCurrency(row.amount)}
                        </td>
                        <td className="px-3 py-3 tabular-nums">{row.senderNumber}</td>
                        <td className="px-3 py-3 font-mono text-xs">{row.senderReference}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setDecision({ row, approve: false })}
                            >
                              <RiCloseLine className="size-4" aria-hidden="true" />
                              Refuse
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setDecision({ row, approve: true })}
                            >
                              <RiCheckLine className="size-4" aria-hidden="true" />
                              Approve
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(open) => !open && setDecision(null)}
        onConfirm={handleConfirm}
        isPending={isPending}
        destructive={decision?.approve === false}
        title={decision?.approve ? "Approve this payment?" : "Refuse this payment?"}
        confirmLabel={decision?.approve ? "Approve and activate" : "Refuse"}
        pendingLabel={decision?.approve ? "Approving..." : "Refusing..."}
        description={
          decision?.approve ? (
            <>
              <p>
                <strong>{decision.row.agency.name}</strong> goes onto {decision.row.plan.name} for{" "}
                {decision.row.plan.durationDays} days, starting from whatever time they have left.
              </p>
              <p className="mt-2">
                Check <span className="font-mono">{decision.row.senderReference}</span> for{" "}
                {formatCurrency(decision.row.amount)} is in your bKash statement first. This cannot
                be undone from here.
              </p>
            </>
          ) : (
            <p>
              <strong>{decision?.row.agency.name}</strong> keeps whatever plan they are on, and can
              send a corrected payment afterwards.
            </p>
          )
        }
      />
    </>
  );
};

export default ManualPaymentQueue;
