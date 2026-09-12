"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordDateChangeAction } from "@/app/(dashboardLayout)/dashboard/tickets/_action";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
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
import { formatCurrency, formatDateForInput, toNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  dateChangeFieldsZodSchema,
  type IDateChangeFormValues,
} from "@/zod/ticket.validation";
import { type ITicket } from "@/types/ticket.types";

interface DateChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: ITicket;
}

/**
 * A flight date change, additive on both sides.
 *
 * The fee raises what the customer is charged; the cost raises what the
 * supplier is owed. Neither replaces the original figure — which is the whole
 * point. The old implementation had no concept of this: its reissue path
 * overwrote the fare and left the cost stale, so every reissue silently
 * inflated profit by the fare difference.
 *
 * Note this is a replace, not an accumulate: submitting again overwrites the
 * previous fee and cost rather than adding to them, matching the API, which
 * stores one pair of date-change columns per ticket.
 */
const DateChangeDialog = ({ open, onOpenChange, ticket }: DateChangeDialogProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IDateChangeFormValues) => recordDateChangeAction(ticket.id, values),
  });

  // Annotated, not `satisfies`: the form values type keeps its optional
  // fields as `string | undefined`, which is what the optional zod field
  // validators expect. `satisfies` would narrow every value to a plain
  // `string` and the validators would no longer typecheck against it.
  const defaultValues: IDateChangeFormValues = {
    dateChangedAt: formatDateForInput(ticket.dateChangedAt),
    travelDate: formatDateForInput(ticket.travelDate),
    dateChangeCost: ticket.dateChangeCost ? String(toNumber(ticket.dateChangeCost)) : "",
    dateChangeFee: ticket.dateChangeFee ? String(toNumber(ticket.dateChangeFee)) : "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        // Refused on a refunded or void ticket, with the reason.
        toast.error(result.message || "Failed to record the date change");
        return;
      }

      toast.success(result.message || "Date change recorded");
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["ticket", ticket.id] });
      // Both sides moved: the customer is charged more and the supplier owed more.
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      void queryClient.invalidateQueries({ queryKey: ["supplier-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["supplier-ledger"] });
      void queryClient.refetchQueries({ queryKey: ["tickets"], type: "active" });
      router.refresh();
    },
  });

  const alreadyChanged = Boolean(ticket.dateChangedAt);

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
          <DialogTitle>{alreadyChanged ? "Update date change" : "Change flight date"}</DialogTitle>
          <DialogDescription>
            PNR {ticket.pnr}. The fee is added to what the customer is charged and the cost to
            what the supplier is owed — the original fare and cost stay as they are.
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
          <form.Field name="travelDate">
            {(field) => (
              <AppField
                field={field}
                label="New travel date"
                type="date"
                disabled={isPending}
                hint="Leave blank to keep the current date."
              />
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="dateChangeFee"
              validators={{ onChange: dateChangeFieldsZodSchema.shape.dateChangeFee }}
            >
              {(field) => (
                <AppField
                  field={field}
                  label="Fee charged"
                  placeholder="0.00"
                  disabled={isPending}
                  prepend={<span className="text-sm">৳</span>}
                  hint="To the customer"
                />
              )}
            </form.Field>

            <form.Field
              name="dateChangeCost"
              validators={{ onChange: dateChangeFieldsZodSchema.shape.dateChangeCost }}
            >
              {(field) => (
                <AppField
                  field={field}
                  label="Cost incurred"
                  placeholder="0.00"
                  disabled={isPending}
                  prepend={<span className="text-sm">৳</span>}
                  hint="From the airline"
                />
              )}
            </form.Field>
          </div>

          {/* Shows the whole ticket after the change, not just the delta — a fee
              smaller than the cost turns a profitable ticket into a loss, and
              that is the thing worth seeing before saving. */}
          <form.Subscribe
            selector={(state) =>
              [state.values.dateChangeFee, state.values.dateChangeCost] as const
            }
          >
            {([fee, cost]) => {
              const baseFare = toNumber(ticket.fare);
              const baseCost = toNumber(ticket.cost);
              const refund = toNumber(ticket.refundAmount);
              const newCharge = baseFare + toNumber(fee) - refund;
              const newCost = baseCost + toNumber(cost);
              const newProfit = newCharge - newCost;
              const changeMargin = toNumber(fee) - toNumber(cost);

              return (
                <dl className="space-y-1 rounded-md border bg-muted/40 p-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Margin on the change</dt>
                    <dd
                      className={cn(
                        "font-medium tabular-nums",
                        changeMargin > 0 && "text-success",
                        changeMargin < 0 && "text-destructive",
                      )}
                    >
                      {formatCurrency(changeMargin)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Customer charged</dt>
                    <dd className="tabular-nums">{formatCurrency(newCharge)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Supplier cost</dt>
                    <dd className="tabular-nums">{formatCurrency(newCost)}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <dt>Ticket profit</dt>
                    <dd
                      className={cn(
                        "font-medium tabular-nums",
                        newProfit > 0 && "text-success",
                        newProfit < 0 && "text-destructive",
                      )}
                    >
                      {formatCurrency(newProfit)}
                    </dd>
                  </div>
                </dl>
              );
            }}
          </form.Subscribe>

          <form.Field name="dateChangedAt">
            {(field) => (
              <AppField
                field={field}
                label="Change recorded on"
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
                  pendingLabel="Saving..."
                  disabled={!canSubmit}
                  className="w-auto"
                >
                  {alreadyChanged ? "Update change" : "Record change"}
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DateChangeDialog;
