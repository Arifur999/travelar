"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordVisaPaymentAction } from "@/app/(dashboardLayout)/dashboard/visa/_action";
import { useWalletBalance } from "@/components/modules/Wallet/useWalletBalance";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import PaymentSourceFields from "@/components/shared/form/PaymentSourceFields";
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
import { formatCurrency } from "@/lib/format";
import { paymentCap, toPaymentPayload, type PaymentSource } from "@/lib/paymentSource";
import {
  visaPaymentFieldsZodSchema,
  type IVisaPaymentFormValues,
} from "@/zod/visa.validation";
import { PAYMENT_METHOD_OPTIONS, type PaymentMethod } from "@/types/enums.types";
import { type IVisaCase } from "@/types/visa.types";

interface VisaPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visaCase: IVisaCase;
}

/**
 * Invoice-level, so capped at the outstanding due — the same rule as a ticket
 * payment, and different from a ledger-level collection where over-payment
 * legitimately becomes a credit.
 */
const VisaPaymentDialog = ({ open, onOpenChange, visaCase }: VisaPaymentDialogProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { balance: walletBalance } = useWalletBalance(visaCase.customer.id, open);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IVisaPaymentFormValues) =>
      recordVisaPaymentAction(visaCase.id, toPaymentPayload(values)),
  });

  const defaultValues: IVisaPaymentFormValues = {
    source: "ACCOUNT",
    cashAccountId: "",
    amount: visaCase.dueAmount > 0 ? String(visaCase.dueAmount) : "",
    method: "CASH",
    reference: "",
    note: "",
    paidAt: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Failed to record payment");
        return;
      }

      toast.success(result.message || "Payment recorded");
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["visa-cases"] });
      void queryClient.invalidateQueries({ queryKey: ["visa-case", visaCase.id] });
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-holders"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-statement"] });
      void queryClient.refetchQueries({ queryKey: ["visa-cases"], type: "active" });
      router.refresh();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) form.reset();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
          <DialogDescription>
            {visaCase.country} {visaCase.visaType} · outstanding{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(visaCase.dueAmount)}
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
            form.handleSubmit();
          }}
          className="space-y-5"
        >
          <form.Subscribe
            selector={(state) => [state.values.source, state.values.cashAccountId ?? ""] as const}
          >
            {([source, cashAccountId]) => (
              <PaymentSourceFields
                source={source}
                onSourceChange={(next: PaymentSource) => {
                  form.setFieldValue("source", next);
                  // A settlement takes no cash, so the amount can only be what
                  // is left; the API refuses more either way.
                  form.setFieldValue(
                    "amount",
                    String(paymentCap(visaCase.dueAmount, next, walletBalance)),
                  );
                }}
                cashAccountId={cashAccountId}
                onAccountChange={(next) => form.setFieldValue("cashAccountId", next)}
                walletBalance={walletBalance}
                active={open}
                disabled={isPending}
                idPrefix={`visa-payment-${visaCase.id}`}
              />
            )}
          </form.Subscribe>

          <form.Subscribe selector={(state) => state.values.source}>
            {(source) => (
              <>
                <form.Field
                  name="amount"
                  validators={{ onChange: visaPaymentFieldsZodSchema.shape.amount }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Amount"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                      hint={
                        source === "WALLET"
                          ? `Cannot exceed the ${formatCurrency(
                              paymentCap(visaCase.dueAmount, source, walletBalance),
                            )} available from what this customer paid in.`
                          : `Cannot exceed the outstanding ${formatCurrency(visaCase.dueAmount)}.`
                      }
                    />
                  )}
                </form.Field>

                {/* Both describe cash changing hands, which a settlement is not. */}
                {source === "ACCOUNT" && (
                  <>
                    <form.Field name="method">
                      {(field) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={field.name}>Method</Label>
                          <Select
                            value={field.state.value}
                            onValueChange={(next) => field.handleChange(next as PaymentMethod)}
                            disabled={isPending}
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
                    </form.Field>

                    <form.Field
                      name="reference"
                      validators={{ onChange: visaPaymentFieldsZodSchema.shape.reference }}
                    >
                      {(field) => (
                        <AppField
                          field={field}
                          label="Reference"
                          placeholder="Receipt or transaction number"
                          disabled={isPending}
                          hint="Optional"
                        />
                      )}
                    </form.Field>
                  </>
                )}
              </>
            )}
          </form.Subscribe>

          <form.Field name="paidAt">
            {(field) => (
              <AppField
                field={field}
                label="Paid on"
                type="date"
                disabled={isPending}
                hint="Defaults to today."
              />
            )}
          </form.Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
              {([canSubmit, isSubmitting]) => (
                <AppSubmitButton
                  isPending={isSubmitting || isPending}
                  pendingLabel="Recording..."
                  disabled={!canSubmit}
                  className="w-auto"
                >
                  Record payment
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VisaPaymentDialog;
