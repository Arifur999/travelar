"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BedDouble, HandCoins, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  assignHajjRoomAction,
  changeHajjBookingStatusAction,
  deleteHajjPaymentAction,
  recordHajjPaymentAction,
  setHajjDocumentStatusAction,
} from "@/app/(dashboardLayout)/dashboard/hajj/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Loader from "@/components/shared/Loader";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "@tanstack/react-form";
import { formatCurrency, formatDate, formatDateTime, toNumber } from "@/lib/format";
import { getCashAccounts } from "@/services/account.services";
import { getHajjBookingById, getHajjRooms } from "@/services/hajj.services";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_OPTIONS,
  DOCUMENT_STATUS_TONES,
  HAJJ_BOOKING_STATUS_LABELS,
  HAJJ_BOOKING_STATUS_TONES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  type DocumentStatus,
  type HajjHotelType,
  type PaymentMethod,
} from "@/types/enums.types";
import {
  HAJJ_BOOKING_TRANSITIONS,
  isHajjBookingFinal,
  type IHajjBooking,
  type IHajjPayment,
} from "@/types/hajj.types";
import {
  hajjPaymentFieldsZodSchema,
  hajjStatusFieldsZodSchema,
  type IHajjPaymentFormValues,
  type IHajjStatusFormValues,
} from "@/zod/hajj.validation";

interface HajjBookingDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: IHajjBooking;
  canDeletePayment: boolean;
}

const UNASSIGNED = "__unassigned__";

const STATUS_DESCRIPTIONS: Record<string, string> = {
  CONFIRMED: "The seat is committed and the pilgrim is going.",
  CANCELLED: "Frees the seat and both room assignments. Final.",
  COMPLETED: "The journey is done. Final.",
};

const HajjBookingDetailSheet = ({
  open,
  onOpenChange,
  booking,
  canDeletePayment,
}: HajjBookingDetailSheetProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<IHajjPayment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["hajj-booking", booking.id],
    queryFn: () => getHajjBookingById(booking.id),
    enabled: open,
  });

  const current = data?.data ?? booking;
  const documents = data?.data.documents ?? [];
  const payments = data?.data.payments ?? [];
  const history = data?.data.statusHistory ?? [];

  const { data: roomsData } = useQuery({
    queryKey: ["hajj-rooms", current.batchId],
    queryFn: () => getHajjRooms(current.batchId),
    enabled: open,
  });

  const { data: accountsData } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
    enabled: open && isPaymentOpen,
  });

  const rooms = roomsData?.data ?? [];
  const accounts = (accountsData?.data.data ?? []).filter((account) => account.isActive);
  const isFinal = isHajjBookingFinal(current.status);
  const allowed = HAJJ_BOOKING_TRANSITIONS[current.status];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["hajj-bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["hajj-booking", current.id] });
    void queryClient.invalidateQueries({ queryKey: ["hajj-batches"] });
    void queryClient.invalidateQueries({ queryKey: ["hajj-batch-summary"] });
    router.refresh();
  };

  const { mutateAsync: assignRoom } = useMutation({
    mutationFn: ({ hotelType, roomId }: { hotelType: HajjHotelType; roomId: string | null }) =>
      assignHajjRoomAction(current.id, { hotelType, roomId }),
  });

  const { mutateAsync: setDocStatus } = useMutation({
    mutationFn: ({ documentId, status }: { documentId: string; status: DocumentStatus }) =>
      setHajjDocumentStatusAction(current.id, documentId, status),
  });

  const { mutateAsync: removePayment, isPending: isDeletingPayment } = useMutation({
    mutationFn: (paymentId: string) => deleteHajjPaymentAction(current.id, paymentId),
  });

  const { mutateAsync: submitPayment, isPending: isPayingPending } = useMutation({
    mutationFn: (values: IHajjPaymentFormValues) =>
      recordHajjPaymentAction(current.id, values),
  });

  const { mutateAsync: submitStatus, isPending: isStatusPending } = useMutation({
    mutationFn: (values: IHajjStatusFormValues) =>
      changeHajjBookingStatusAction(current.id, values),
  });

  const paymentDefaults: IHajjPaymentFormValues = {
    cashAccountId: "",
    amount: current.dueAmount > 0 ? String(current.dueAmount) : "",
    method: "CASH",
    transactionRef: "",
    note: "",
    paidAt: "",
  };

  const paymentForm = useForm({
    defaultValues: paymentDefaults,
    onSubmit: async ({ value }) => {
      const result = await submitPayment(value);
      if (!result.success) {
        toast.error(result.message || "Failed to record payment");
        return;
      }

      toast.success(result.message || "Payment recorded");
      setIsPaymentOpen(false);
      paymentForm.reset();
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
      invalidate();
    },
  });

  const statusDefaults: IHajjStatusFormValues = {
    status: (allowed[0] ?? "CONFIRMED") as IHajjStatusFormValues["status"],
    note: "",
  };

  const statusForm = useForm({
    defaultValues: statusDefaults,
    onSubmit: async ({ value }) => {
      const result = await submitStatus(value);
      if (!result.success) {
        toast.error(result.message || "Failed to change status");
        return;
      }

      toast.success(result.message || "Status updated");
      setIsStatusOpen(false);
      statusForm.reset();
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      invalidate();
    },
  });

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

  const roomSelect = (hotelType: HajjHotelType, assignedId?: string | null) => {
    const options = rooms.filter((room) => room.hotelType === hotelType);

    return (
      <div className="space-y-1.5">
        <Label htmlFor={`room-${hotelType}`}>
          {hotelType === "MAKKAH" ? "Makkah" : "Madinah"} room
        </Label>
        <Select
          value={assignedId || UNASSIGNED}
          disabled={isFinal}
          onValueChange={async (next) => {
            // null is the documented way to clear an assignment and free the bed.
            const result = await assignRoom({
              hotelType,
              roomId: next === UNASSIGNED ? null : next,
            });
            if (!result.success) {
              // The API refuses a room already at capacity, naming it.
              toast.error(result.message || "Failed to assign room");
              return;
            }
            invalidate();
          }}
        >
          <SelectTrigger id={`room-${hotelType}`} className="w-full">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {options.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.roomNumber} · sleeps {room.capacity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {options.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No {hotelType === "MAKKAH" ? "Makkah" : "Madinah"} rooms on this batch yet.
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full gap-0 sm:max-w-2xl">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <SheetTitle>{current.pilgrimName}</SheetTitle>
              <StatusBadge
                label={HAJJ_BOOKING_STATUS_LABELS[current.status]}
                tone={HAJJ_BOOKING_STATUS_TONES[current.status]}
              />
            </div>
            <SheetDescription>
              {current.hajjPackage.name} · {current.batch.name} · departs{" "}
              {formatDate(current.batch.departureDate)}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsPaymentOpen(true)}
                disabled={current.dueAmount <= 0 || isFinal}
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
                Change status
              </Button>
            </div>

            {isFinal && (
              <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                {HAJJ_BOOKING_STATUS_LABELS[current.status]} is final.
                {current.status === "CANCELLED" &&
                  " The seat and both rooms were released when it was cancelled."}
              </p>
            )}

            {/* Money */}
            <section>
              <h3 className="mb-2 text-sm font-medium">Money</h3>
              <dl className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Package price</dt>
                  <dd className="tabular-nums">{formatCurrency(current.packagePrice)}</dd>
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
              <p className="mt-2 text-xs text-muted-foreground">
                {/* Honest about a real gap rather than inventing a margin. */}
                A booking records what the pilgrim is charged but not what the package costs the
                agency, so profit on Hajj cannot be derived from this alone.
              </p>
            </section>

            {/* Rooms */}
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <BedDouble className="size-4" aria-hidden="true" />
                Rooms
              </h3>
              <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
                {roomSelect("MAKKAH", current.makkahRoomId)}
                {roomSelect("MADINAH", current.madinahRoomId)}
              </div>
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
                  {documents.map((document) => (
                    <li key={document.id} className="flex flex-wrap items-center gap-2">
                      <span className="flex-1 text-sm">{document.title}</span>
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
                    </li>
                  ))}
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
                            <Badge variant="outline">{payment.cashAccount.name}</Badge>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {PAYMENT_METHOD_LABELS[payment.method]}
                            {payment.transactionRef && (
                              <span className="block text-xs">{payment.transactionRef}</span>
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
                            {HAJJ_BOOKING_STATUS_LABELS[entry.fromStatus]}
                          </span>
                          <span aria-hidden="true">→</span>
                        </>
                      )}
                      <StatusBadge
                        label={HAJJ_BOOKING_STATUS_LABELS[entry.toStatus]}
                        tone={HAJJ_BOOKING_STATUS_TONES[entry.toStatus]}
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

      {/* Payment */}
      <Dialog
        open={isPaymentOpen}
        onOpenChange={(nextOpen) => {
          setIsPaymentOpen(nextOpen);
          if (!nextOpen) paymentForm.reset();
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Take payment</DialogTitle>
            <DialogDescription>
              {current.pilgrimName} · outstanding{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(current.dueAmount)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form
            method="POST"
            action="#"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              paymentForm.handleSubmit();
            }}
            className="space-y-5"
          >
            <paymentForm.Field name="cashAccountId">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Into account</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    disabled={isPayingPending}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue placeholder="Pick an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} — {formatCurrency(account.currentBalance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </paymentForm.Field>

            <paymentForm.Field
              name="amount"
              validators={{ onChange: hajjPaymentFieldsZodSchema.shape.amount }}
            >
              {(field) => (
                <AppField
                  field={field}
                  label="Amount"
                  placeholder="0.00"
                  disabled={isPayingPending}
                  prepend={<span className="text-sm">৳</span>}
                  hint={`Cannot exceed the outstanding ${formatCurrency(current.dueAmount)}.`}
                />
              )}
            </paymentForm.Field>

            <paymentForm.Field name="method">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Method</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(next) => field.handleChange(next as PaymentMethod)}
                    disabled={isPayingPending}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </paymentForm.Field>

            <paymentForm.Field
              name="transactionRef"
              validators={{ onChange: hajjPaymentFieldsZodSchema.shape.transactionRef }}
            >
              {(field) => (
                <AppField
                  field={field}
                  label="Reference"
                  disabled={isPayingPending}
                  hint="Optional"
                />
              )}
            </paymentForm.Field>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPayingPending}>
                  Cancel
                </Button>
              </DialogClose>
              <paymentForm.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting] as const}
              >
                {([canSubmit, isSubmitting]) => (
                  <AppSubmitButton
                    isPending={isSubmitting || isPayingPending}
                    pendingLabel="Recording..."
                    disabled={!canSubmit}
                    className="w-auto"
                  >
                    Record payment
                  </AppSubmitButton>
                )}
              </paymentForm.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status */}
      <Dialog
        open={isStatusOpen}
        onOpenChange={(nextOpen) => {
          setIsStatusOpen(nextOpen);
          if (!nextOpen) statusForm.reset();
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Change booking status</DialogTitle>
            <DialogDescription>
              {current.pilgrimName} is {HAJJ_BOOKING_STATUS_LABELS[current.status]}. This
              lifecycle is one-way.
            </DialogDescription>
          </DialogHeader>

          <form
            method="POST"
            action="#"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              statusForm.handleSubmit();
            }}
            className="space-y-5"
          >
            <statusForm.Field name="status">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>New status</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(next) =>
                      field.handleChange(next as IHajjStatusFormValues["status"])
                    }
                    disabled={isStatusPending}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allowed.map((option) => (
                        <SelectItem key={option} value={option}>
                          {HAJJ_BOOKING_STATUS_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_DESCRIPTIONS[field.state.value]}
                  </p>
                </div>
              )}
            </statusForm.Field>

            <statusForm.Field
              name="note"
              validators={{ onChange: hajjStatusFieldsZodSchema.shape.note }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Note</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    rows={2}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    disabled={isStatusPending}
                  />
                </div>
              )}
            </statusForm.Field>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isStatusPending}>
                  Cancel
                </Button>
              </DialogClose>
              <statusForm.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting] as const}
              >
                {([canSubmit, isSubmitting]) => (
                  <AppSubmitButton
                    isPending={isSubmitting || isStatusPending}
                    pendingLabel="Updating..."
                    disabled={!canSubmit}
                    className="w-auto"
                  >
                    Change status
                  </AppSubmitButton>
                )}
              </statusForm.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                from {deletingPayment.cashAccount.name}.{" "}
              </>
            )}
            The posting is deleted, so the account goes back down and this booking shows the
            amount outstanding again.
          </>
        }
      />
    </>
  );
};

export default HajjBookingDetailSheet;
