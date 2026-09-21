"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { HandCoins, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addVisaDocumentAction,
  deleteVisaDocumentAction,
  deleteVisaPaymentAction,
  setVisaDocumentStatusAction,
} from "@/app/(dashboardLayout)/dashboard/visa/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import InvoiceButton from "@/components/shared/InvoiceButton";
import Loader from "@/components/shared/Loader";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatDate, formatDateTime, toNumber } from "@/lib/format";
import { getVisaCaseById } from "@/services/visa.services";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_OPTIONS,
  DOCUMENT_STATUS_TONES,
  PAYMENT_METHOD_LABELS,
  VISA_STATUS_LABELS,
  VISA_STATUS_TONES,
  type DocumentStatus,
} from "@/types/enums.types";
import { isVisaFinal, type IVisaCase, type IVisaPayment } from "@/types/visa.types";
import VisaPaymentDialog from "./VisaPaymentDialog";
import VisaStatusDialog from "./VisaStatusDialog";

interface VisaCaseDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visaCase: IVisaCase;
  canDeletePayment: boolean;
}

const VisaCaseDetailSheet = ({
  open,
  onOpenChange,
  visaCase,
  canDeletePayment,
}: VisaCaseDetailSheetProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [newDocument, setNewDocument] = useState("");
  const [deletingPayment, setDeletingPayment] = useState<IVisaPayment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["visa-case", visaCase.id],
    queryFn: () => getVisaCaseById(visaCase.id),
    enabled: open,
  });

  const current = data?.data ?? visaCase;
  const documents = data?.data.documents ?? [];
  const payments = data?.data.payments ?? [];
  const history = data?.data.statusHistory ?? [];

  const isFinal = isVisaFinal(current.status);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["visa-cases"] });
    void queryClient.invalidateQueries({ queryKey: ["visa-case", current.id] });
    router.refresh();
  };

  const { mutateAsync: addDocument, isPending: isAdding } = useMutation({
    mutationFn: (title: string) => addVisaDocumentAction(current.id, { title }),
  });

  const { mutateAsync: setDocStatus } = useMutation({
    mutationFn: ({ documentId, status }: { documentId: string; status: DocumentStatus }) =>
      setVisaDocumentStatusAction(current.id, documentId, status),
  });

  const { mutateAsync: removeDocument } = useMutation({
    mutationFn: (documentId: string) => deleteVisaDocumentAction(current.id, documentId),
  });

  const { mutateAsync: removePayment, isPending: isDeletingPayment } = useMutation({
    mutationFn: (paymentId: string) => deleteVisaPaymentAction(current.id, paymentId),
  });

  const handleAddDocument = async () => {
    const title = newDocument.trim();
    if (title.length < 2) return;

    const result = await addDocument(title);
    if (!result.success) {
      toast.error(result.message || "Failed to add document");
      return;
    }

    setNewDocument("");
    invalidate();
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    const result = await removePayment(deletingPayment.id);
    if (!result.success) {
      toast.error(result.message || "Failed to delete payment");
      return;
    }

    toast.success(result.message || "Payment reversed");
    setDeletingPayment(null);
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    invalidate();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full gap-0 sm:max-w-2xl">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <SheetTitle>
                {current.country} · {current.visaType}
              </SheetTitle>
              <StatusBadge
                label={VISA_STATUS_LABELS[current.status]}
                tone={VISA_STATUS_TONES[current.status]}
              />
            </div>
            <SheetDescription>
              {current.customer.name} ({current.customer.phone})
              {current.applicationNo ? ` · ${current.applicationNo}` : ""}
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
                onClick={() => setIsStatusOpen(true)}
                disabled={isFinal}
              >
                <RefreshCcw className="size-4" aria-hidden="true" />
                Move forward
              </Button>
              <InvoiceButton kind="visa" id={current.id} />
            </div>

            {isFinal && (
              <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                {VISA_STATUS_LABELS[current.status]} is a final status — the case cannot move
                any further.
              </p>
            )}

            {current.rejectionNote && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
                <span className="font-medium">Refused:</span> {current.rejectionNote}
              </p>
            )}

            {/* Money */}
            <section>
              <h3 className="mb-2 text-sm font-medium">Money</h3>
              <dl className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Service fee</dt>
                  <dd className="tabular-nums">{formatCurrency(current.serviceFee)}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Embassy fee</dt>
                  <dd className="tabular-nums">{formatCurrency(current.embassyFee)}</dd>
                </div>
                <div className="flex justify-between border-t py-1 pt-2 font-medium">
                  <dt>Billed</dt>
                  <dd className="tabular-nums">{formatCurrency(current.totalFee)}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Paid</dt>
                  <dd className="tabular-nums text-success">
                    {formatCurrency(current.totalPaid)}
                  </dd>
                </div>
                <div className="flex justify-between border-t py-1 pt-2 font-medium">
                  <dt>Outstanding</dt>
                  <dd
                    className={
                      current.dueAmount > 0
                        ? "tabular-nums text-destructive"
                        : "tabular-nums text-success"
                    }
                  >
                    {formatCurrency(current.dueAmount)}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Documents */}
            <section>
              <h3 className="mb-2 text-sm font-medium">
                Documents{" "}
                <span className="font-normal text-muted-foreground">
                  {current.documentsProgress.received}/{current.documentsProgress.total} in
                </span>
              </h3>

              {isLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader size={24} label="Loading documents" />
                </div>
              ) : (
                <ul className="space-y-2 rounded-lg border p-3">
                  {documents.length === 0 && (
                    <li className="text-sm text-muted-foreground">
                      No checklist — the visa type had no preset.
                    </li>
                  )}

                  {documents.map((document) => (
                    <li key={document.id} className="flex flex-wrap items-center gap-2">
                      <span className="flex-1 text-sm">{document.title}</span>

                      {/* Each document is a real row with an id. The old code
                          addressed checklist items by array index, so removing
                          one silently retargeted every later item. */}
                      <Select
                        value={document.status}
                        onValueChange={async (next) => {
                          const result = await setDocStatus({
                            documentId: document.id,
                            status: next as DocumentStatus,
                          });
                          if (!result.success) {
                            toast.error(result.message || "Failed to update document");
                            return;
                          }
                          invalidate();
                        }}
                      >
                        <SelectTrigger
                          className="h-7 w-32"
                          aria-label={`${document.title} status`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <StatusBadge
                        label={DOCUMENT_STATUS_LABELS[document.status]}
                        tone={DOCUMENT_STATUS_TONES[document.status]}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={async () => {
                          const result = await removeDocument(document.id);
                          if (!result.success) {
                            toast.error(result.message || "Failed to delete document");
                            return;
                          }
                          invalidate();
                        }}
                        aria-label={`Remove ${document.title}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}

                  <li className="flex gap-2 border-t pt-2">
                    <Input
                      value={newDocument}
                      onChange={(event) => setNewDocument(event.target.value)}
                      placeholder="Add another document"
                      aria-label="New document name"
                      className="h-8"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleAddDocument();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddDocument}
                      disabled={isAdding || newDocument.trim().length < 2}
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      Add
                    </Button>
                  </li>
                </ul>
              )}
            </section>

            {/* Payments */}
            <section>
              <h3 className="mb-2 text-sm font-medium">Payments</h3>
              {payments.length === 0 ? (
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
                            <Badge variant="outline">{payment.cashAccount?.name ?? "Customer balance"}</Badge>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {payment.fromWallet ? "Settled from balance" : PAYMENT_METHOD_LABELS[payment.method]}
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
                            {VISA_STATUS_LABELS[entry.fromStatus]}
                          </span>
                          <span aria-hidden="true">→</span>
                        </>
                      )}
                      <StatusBadge
                        label={VISA_STATUS_LABELS[entry.toStatus]}
                        tone={VISA_STATUS_TONES[entry.toStatus]}
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

      <VisaPaymentDialog
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        visaCase={current}
      />
      <VisaStatusDialog open={isStatusOpen} onOpenChange={setIsStatusOpen} visaCase={current} />

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
                  {formatCurrency(toNumber(deletingPayment.amount))}
                </span>{" "}
                from {deletingPayment.cashAccount?.name ?? "the customer balance"}.{" "}
              </>
            )}
            {deletingPayment?.fromWallet
              ? "The amount goes back to what the customer has left, and this case shows the"
              : "The posting is deleted, so the account goes back down and this case shows the"}{" "}
            amount outstanding again.
          </>
        }
      />
    </>
  );
};

export default VisaCaseDetailSheet;
