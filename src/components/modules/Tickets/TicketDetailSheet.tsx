"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CalendarSync, HandCoins, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTicketPaymentAction } from "@/app/(dashboardLayout)/dashboard/tickets/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Loader from "@/components/shared/Loader";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatDate, formatDateTime, toNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getTicketById } from "@/services/ticket.services";
import {
  PAYMENT_METHOD_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_TONES,
} from "@/types/enums.types";
import { isTicketFinal, type ITicket, type ITicketPayment } from "@/types/ticket.types";
import ChangeStatusDialog from "./ChangeStatusDialog";
import DateChangeDialog from "./DateChangeDialog";
import RecordPaymentDialog from "./RecordPaymentDialog";

interface TicketDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: ITicket;
  canDeletePayment: boolean;
}

const Row = ({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  tone?: "success" | "destructive";
}) => (
  <div className={cn("flex justify-between py-1", bold && "border-t pt-2 font-medium")}>
    <dt className={bold ? undefined : "text-muted-foreground"}>{label}</dt>
    <dd
      className={cn(
        "tabular-nums",
        tone === "success" && "text-success",
        tone === "destructive" && "text-destructive",
      )}
    >
      {value}
    </dd>
  </div>
);

/**
 * Everything about one ticket: the additive money breakdown, its payments, and
 * its status history.
 *
 * The breakdown is laid out to show the arithmetic rather than just the result,
 * because the whole point of the additive model is that a date change and a
 * refund are visible lines rather than edits to the original fare.
 */
const TicketDetailSheet = ({
  open,
  onOpenChange,
  ticket,
  canDeletePayment,
}: TicketDetailSheetProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDateChangeOpen, setIsDateChangeOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<ITicketPayment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ticket", ticket.id],
    queryFn: () => getTicketById(ticket.id),
    enabled: open,
  });

  // Falls back to the row until the detail lands, so the sheet has content
  // immediately rather than flashing empty.
  const current = data?.data ?? ticket;
  const payments = data?.data.payments ?? [];
  const history = data?.data.statusHistory ?? [];

  const isFinal = isTicketFinal(current.status);
  const fare = toNumber(current.fare);
  const cost = toNumber(current.cost);
  const dateChangeFee = toNumber(current.dateChangeFee);
  const dateChangeCost = toNumber(current.dateChangeCost);
  const refund = toNumber(current.refundAmount);

  const { mutateAsync: runDeletePayment, isPending: isDeletingPayment } = useMutation({
    mutationFn: (paymentId: string) => deleteTicketPaymentAction(current.id, paymentId),
  });

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    const result = await runDeletePayment(deletingPayment.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete payment");
      return;
    }

    toast.success(result.message || "Payment reversed");
    setDeletingPayment(null);
    void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    void queryClient.invalidateQueries({ queryKey: ["ticket", current.id] });
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    router.refresh();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full gap-0 sm:max-w-2xl">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <SheetTitle className="font-mono tracking-wide">{current.pnr}</SheetTitle>
              <StatusBadge
                label={TICKET_STATUS_LABELS[current.status]}
                tone={TICKET_STATUS_TONES[current.status]}
              />
            </div>
            <SheetDescription>
              {current.passengerName} · {current.customer.name} ({current.customer.phone})
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsPaymentOpen(true)}
                disabled={current.dueAmount <= 0}
              >
                <HandCoins className="size-4" aria-hidden="true" />
                Take payment
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsDateChangeOpen(true)}
                disabled={isFinal}
              >
                <CalendarSync className="size-4" aria-hidden="true" />
                {current.dateChangedAt ? "Update date change" : "Change date"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsStatusOpen(true)}
                disabled={isFinal}
              >
                <RefreshCcw className="size-4" aria-hidden="true" />
                Change status
              </Button>
            </div>

            {isFinal && (
              <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                {TICKET_STATUS_LABELS[current.status]} is a final status — no further change,
                date change or status move is possible.
              </p>
            )}

            {/* Flight */}
            <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Airline</dt>
                <dd className="font-medium">{current.airline?.shortCode ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Route</dt>
                <dd className="font-mono text-xs font-medium">{current.route?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Travel</dt>
                <dd className="font-medium">{formatDate(current.travelDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Supplier</dt>
                <dd className="truncate font-medium">{current.supplier?.name ?? "—"}</dd>
              </div>
            </dl>

            {/* The additive money model, shown as arithmetic. */}
            <section>
              <h3 className="mb-2 text-sm font-medium">Money</h3>
              <dl className="rounded-lg border p-3 text-sm">
                <Row label="Fare" value={formatCurrency(fare)} />
                {dateChangeFee > 0 && (
                  <Row label="Date change fee" value={`+ ${formatCurrency(dateChangeFee)}`} />
                )}
                {refund > 0 && (
                  <Row
                    label="Refunded"
                    value={`− ${formatCurrency(refund)}`}
                    tone="destructive"
                  />
                )}
                <Row
                  label="Customer charged"
                  value={formatCurrency(current.customerCharge)}
                  bold
                />

                <div className="mt-3" />
                <Row label="Cost" value={formatCurrency(cost)} />
                {dateChangeCost > 0 && (
                  <Row label="Date change cost" value={`+ ${formatCurrency(dateChangeCost)}`} />
                )}
                <Row label="Supplier cost" value={formatCurrency(current.supplierCost)} bold />

                <div className="mt-3" />
                <Row
                  label="Profit"
                  value={formatCurrency(current.profit)}
                  bold
                  tone={toNumber(current.profit) >= 0 ? "success" : "destructive"}
                />

                <div className="mt-3" />
                <Row label="Paid" value={formatCurrency(current.totalPaid)} tone="success" />
                <Row
                  label="Outstanding"
                  value={formatCurrency(current.dueAmount)}
                  bold
                  tone={current.dueAmount > 0 ? "destructive" : "success"}
                />
              </dl>
            </section>

            {/* Payments */}
            <section>
              <h3 className="mb-2 text-sm font-medium">Payments</h3>
              {isLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader size={24} label="Loading payments" />
                </div>
              ) : payments.length === 0 ? (
                <p className="rounded-lg border p-3 text-sm text-muted-foreground">
                  Nothing collected yet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left font-medium">Date</th>
                        <th className="px-3 py-2 text-left font-medium">Into</th>
                        <th className="px-3 py-2 text-left font-medium">Method</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                        {canDeletePayment && <th className="w-10 px-3 py-2" />}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b last:border-0">
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                            {formatDate(payment.paidAt)}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="outline">{payment.cashAccount.name}</Badge>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {PAYMENT_METHOD_LABELS[payment.method]}
                            {payment.reference && (
                              <span className="block text-xs">{payment.reference}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">
                            {formatCurrency(payment.amount)}
                          </td>
                          {canDeletePayment && (
                            <td className="px-3 py-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeletingPayment(payment)}
                                aria-label={`Reverse payment of ${formatCurrency(payment.amount)}`}
                              >
                                <Trash2 className="size-3.5" aria-hidden="true" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Status history */}
            {history.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-medium">History</h3>
                <ol className="space-y-2 rounded-lg border p-3">
                  {history.map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(entry.changedAt)}
                      </span>
                      {entry.fromStatus && (
                        <>
                          <span className="text-muted-foreground">
                            {TICKET_STATUS_LABELS[entry.fromStatus]}
                          </span>
                          <span aria-hidden="true">→</span>
                        </>
                      )}
                      <StatusBadge
                        label={TICKET_STATUS_LABELS[entry.toStatus]}
                        tone={TICKET_STATUS_TONES[entry.toStatus]}
                      />
                      {entry.note && (
                        <span className="text-xs text-muted-foreground">{entry.note}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <RecordPaymentDialog
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        ticket={current}
      />
      <DateChangeDialog
        open={isDateChangeOpen}
        onOpenChange={setIsDateChangeOpen}
        ticket={current}
      />
      <ChangeStatusDialog open={isStatusOpen} onOpenChange={setIsStatusOpen} ticket={current} />

      <ConfirmDialog
        open={deletingPayment !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeletingPayment(null);
        }}
        onConfirm={handleDeletePayment}
        isPending={isDeletingPayment}
        title="Reverse this payment?"
        confirmLabel="Reverse"
        pendingLabel="Reversing..."
        description={
          <>
            {deletingPayment && (
              <>
                <span className="font-medium text-foreground">
                  {formatCurrency(deletingPayment.amount)}
                </span>{" "}
                from {deletingPayment.cashAccount.name}.{" "}
              </>
            )}
            The posting is deleted, so the account goes back down and this ticket shows the
            amount outstanding again.
          </>
        }
      />
    </>
  );
};

export default TicketDetailSheet;
