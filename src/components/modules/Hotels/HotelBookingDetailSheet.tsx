"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiDeleteBin6Line, RiHandCoinLine, RiPencilLine, RiRefreshLine } from "@remixicon/react";
import { toast } from "sonner";
import {
  changeHotelBookingStatusAction,
  deleteHotelPaymentAction,
  recordHotelPaymentAction,
} from "@/app/(dashboardLayout)/dashboard/hotels/_action";
import HotelBookingFormModal from "@/components/modules/Hotels/HotelBookingFormModal";
import { useWalletBalance } from "@/components/modules/Wallet/useWalletBalance";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import InvoiceButton from "@/components/shared/InvoiceButton";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import PaymentSourceFields from "@/components/shared/form/PaymentSourceFields";
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
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { paymentCap, toPaymentPayload, type PaymentSource } from "@/lib/paymentSource";
import { getHotelBookingById } from "@/services/hotel.services";
import {
  hotelPaymentFieldsZodSchema,
  type IHotelPaymentFormValues,
  type IHotelStatusFormValues,
} from "@/zod/hotel.validation";
import {
  HOTEL_BOOKING_STATUS_LABELS,
  HOTEL_BOOKING_STATUS_TONES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from "@/types/enums.types";
import {
  HOTEL_BOOKING_TRANSITIONS,
  isHotelBookingFinal,
  type IHotelBooking,
  type IHotelPayment,
} from "@/types/hotel.types";

interface HotelBookingDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: IHotelBooking;
  canDeletePayment: boolean;
}

/**
 * Everything that happens to a stay after it is booked: payments, the
 * lifecycle, and the details being corrected.
 *
 * The row that opened this is used until the detail arrives, so the sheet has
 * content on the first frame rather than a spinner.
 */
const HotelBookingDetailSheet = ({
  open,
  onOpenChange,
  booking,
  canDeletePayment,
}: HotelBookingDetailSheetProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<IHotelPayment | null>(null);

  const { data } = useQuery({
    queryKey: ["hotel-booking", booking.id],
    queryFn: () => getHotelBookingById(booking.id),
    enabled: open,
  });

  const current = data?.data ?? booking;
  const payments = data?.data.payments ?? [];
  const history = data?.data.statusHistory ?? [];

  const { balance: walletBalance } = useWalletBalance(
    current.customer.id,
    open && isPaymentOpen,
  );

  const isFinal = isHotelBookingFinal(current.status);
  const allowed = HOTEL_BOOKING_TRANSITIONS[current.status];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["hotel-bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["hotel-booking", current.id] });
    void queryClient.invalidateQueries({ queryKey: ["hotel-summary"] });
    router.refresh();
  };

  const { mutateAsync: removePayment, isPending: isDeletingPayment } = useMutation({
    mutationFn: (paymentId: string) => deleteHotelPaymentAction(current.id, paymentId),
  });

  const { mutateAsync: submitPayment, isPending: isPayingPending } = useMutation({
    mutationFn: (values: IHotelPaymentFormValues) =>
      recordHotelPaymentAction(current.id, toPaymentPayload(values)),
  });

  const { mutateAsync: submitStatus, isPending: isStatusPending } = useMutation({
    mutationFn: (values: IHotelStatusFormValues) =>
      changeHotelBookingStatusAction(current.id, values),
  });

  const paymentForm = useForm({
    defaultValues: {
      source: "ACCOUNT",
      cashAccountId: "",
      amount: current.dueAmount > 0 ? String(current.dueAmount) : "",
      method: "CASH",
      reference: "",
      note: "",
      paidAt: "",
    } as IHotelPaymentFormValues,
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
      void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
      // A wallet payment spends a balance, and an account payment is one of
      // the figures the wallet page derives from — both lists are now stale.
      void queryClient.invalidateQueries({ queryKey: ["wallet-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-holders"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-statement"] });
      invalidate();
    },
  });

  const statusForm = useForm({
    defaultValues: {
      status: (allowed[0] ?? "CONFIRMED") as IHotelStatusFormValues["status"],
      note: "",
    },
    onSubmit: async ({ value }) => {
      const result = await submitStatus(value);
      if (!result.success) {
        toast.error(result.message || "Failed to change status");
        return;
      }

      toast.success(result.message || "Status updated");
      setIsStatusOpen(false);
      statusForm.reset();
      // Cancelling stops billing the customer, so their due moves.
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      invalidate();
    },
  });

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    const result = await removePayment(deletingPayment.id);
    if (!result.success) {
      toast.error(result.message || "Failed to reverse payment");
      return;
    }

    toast.success(result.message || "Payment reversed");
    setDeletingPayment(null);
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["wallet-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["wallet-holders"] });
    void queryClient.invalidateQueries({ queryKey: ["wallet-statement"] });
    invalidate();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full gap-0 sm:max-w-2xl">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <SheetTitle>{current.guestName}</SheetTitle>
              <StatusBadge
                label={HOTEL_BOOKING_STATUS_LABELS[current.status]}
                tone={HOTEL_BOOKING_STATUS_TONES[current.status]}
              />
            </div>
            <SheetDescription>
              {current.hotelName}, {current.city} · {formatDate(current.checkIn)} →{" "}
              {formatDate(current.checkOut)}
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
                <RiHandCoinLine className="size-4" aria-hidden="true" />
                Take payment
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsStatusOpen(true)}
                disabled={isFinal}
              >
                <RiRefreshLine className="size-4" aria-hidden="true" />
                Change status
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsEditOpen(true)}
                disabled={isFinal}
              >
                <RiPencilLine className="size-4" aria-hidden="true" />
                Edit
              </Button>
              <InvoiceButton kind="hotel" id={current.id} />
            </div>

            {isFinal && (
              <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                {HOTEL_BOOKING_STATUS_LABELS[current.status]} is final.
                {current.status === "CANCELLED" &&
                  " The customer stopped being billed for it when it was cancelled."}
              </p>
            )}

            {/* Stay */}
            <section>
              <h3 className="mb-2 text-sm font-medium">Stay</h3>
              <dl className="grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Nights</dt>
                  <dd className="tabular-nums">{formatNumber(current.nights)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Rooms / guests</dt>
                  <dd className="tabular-nums">
                    {formatNumber(current.rooms)} / {formatNumber(current.guests)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Room type</dt>
                  <dd>{current.roomType || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Booked through</dt>
                  <dd>{current.bookedThrough || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Confirmation</dt>
                  <dd>{current.confirmationNo || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Customer</dt>
                  <dd>{current.customer.name}</dd>
                </div>
              </dl>
            </section>

            {/* Money */}
            <section>
              <h3 className="mb-2 text-sm font-medium">Money</h3>
              <dl className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Price</dt>
                  <dd className="tabular-nums">{formatCurrency(current.sellAmount)}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Cost</dt>
                  <dd className="tabular-nums">{formatCurrency(current.costAmount)}</dd>
                </div>
                <div className="flex justify-between border-t py-1 pt-2">
                  <dt className="text-muted-foreground">Profit</dt>
                  <dd
                    className={
                      current.profit >= 0
                        ? "tabular-nums text-success"
                        : "tabular-nums text-destructive"
                    }
                  >
                    {formatCurrency(current.profit)}
                  </dd>
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
              {current.note && (
                <p className="mt-2 text-xs text-muted-foreground">{current.note}</p>
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
                            <Badge variant="outline">
                              {payment.cashAccount?.name ?? "Customer balance"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {payment.fromWallet
                              ? "Settled from balance"
                              : PAYMENT_METHOD_LABELS[payment.method]}
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
                                <RiDeleteBin6Line className="size-3.5" aria-hidden="true" />
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
                            {HOTEL_BOOKING_STATUS_LABELS[entry.fromStatus]}
                          </span>
                          <span aria-hidden="true">→</span>
                        </>
                      )}
                      <StatusBadge
                        label={HOTEL_BOOKING_STATUS_LABELS[entry.toStatus]}
                        tone={HOTEL_BOOKING_STATUS_TONES[entry.toStatus]}
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
        onOpenChange={(next) => {
          setIsPaymentOpen(next);
          if (!next) paymentForm.reset();
        }}
      >
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Take payment</DialogTitle>
            <DialogDescription>
              {current.hotelName} · outstanding{" "}
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
            <paymentForm.Subscribe
              selector={(state) => [state.values.source, state.values.cashAccountId ?? ""] as const}
            >
              {([source, cashAccountId]) => (
                <PaymentSourceFields
                  source={source}
                  onSourceChange={(next: PaymentSource) => {
                    paymentForm.setFieldValue("source", next);
                    // A settlement takes no cash, so the amount can only be
                    // what is left; the API refuses more either way.
                    paymentForm.setFieldValue(
                      "amount",
                      String(paymentCap(current.dueAmount, next, walletBalance)),
                    );
                  }}
                  cashAccountId={cashAccountId}
                  onAccountChange={(next) => paymentForm.setFieldValue("cashAccountId", next)}
                  walletBalance={walletBalance}
                  active={open && isPaymentOpen}
                  disabled={isPayingPending}
                  idPrefix={`hotel-payment-${current.id}`}
                />
              )}
            </paymentForm.Subscribe>

            <paymentForm.Subscribe selector={(state) => state.values.source}>
              {(source) => (
                <>
                  <paymentForm.Field
                    name="amount"
                    validators={{ onChange: hotelPaymentFieldsZodSchema.shape.amount }}
                  >
                    {(field) => (
                      <AppField
                        field={field}
                        label="Amount"
                        placeholder="0.00"
                        disabled={isPayingPending}
                        prepend={<span className="text-sm">৳</span>}
                        hint={
                          source === "WALLET"
                            ? `Cannot exceed the ${formatCurrency(
                                paymentCap(current.dueAmount, source, walletBalance),
                              )} available from what this customer paid in.`
                            : `Cannot exceed the outstanding ${formatCurrency(current.dueAmount)}.`
                        }
                      />
                    )}
                  </paymentForm.Field>

                  {/* Both describe cash changing hands, which a settlement is not. */}
                  {source === "ACCOUNT" && (
                    <>
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
                        name="reference"
                        validators={{ onChange: hotelPaymentFieldsZodSchema.shape.reference }}
                      >
                        {(field) => (
                          <AppField
                            field={field}
                            label="Reference"
                            placeholder="Receipt or transaction number"
                            disabled={isPayingPending}
                            hint="Optional"
                          />
                        )}
                      </paymentForm.Field>
                    </>
                  )}
                </>
              )}
            </paymentForm.Subscribe>

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
        onOpenChange={(next) => {
          setIsStatusOpen(next);
          if (!next) statusForm.reset();
        }}
      >
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Change status</DialogTitle>
            <DialogDescription>
              The lifecycle is one-way: cancelled and checked out are final.
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
                      field.handleChange(next as IHotelStatusFormValues["status"])
                    }
                    disabled={isStatusPending}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Only what this booking can move to — the API enforces
                          the same list and would refuse anything else. */}
                      {allowed.map((option) => (
                        <SelectItem key={option} value={option}>
                          {HOTEL_BOOKING_STATUS_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </statusForm.Field>

            <statusForm.Field name="note">
              {(field) => (
                <AppField field={field} label="Note" disabled={isStatusPending} hint="Optional" />
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
                    Update status
                  </AppSubmitButton>
                )}
              </statusForm.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit — the same form the booking was made with, minus the customer. */}
      <HotelBookingFormModal
        key={`edit-${current.id}`}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        booking={current}
      />

      <ConfirmDialog
        open={deletingPayment !== null}
        onOpenChange={(next) => !next && setDeletingPayment(null)}
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
                from {deletingPayment.cashAccount?.name ?? "the customer balance"}.{" "}
              </>
            )}
            {deletingPayment?.fromWallet
              ? "The amount goes back to what the customer has left, and this booking shows the"
              : "The posting is deleted, so the account goes back down and this booking shows the"}{" "}
            amount outstanding again.
          </>
        }
      />
    </>
  );
};

export default HotelBookingDetailSheet;
