"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { changeTicketStatusAction } from "@/app/(dashboardLayout)/dashboard/tickets/_action";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, toNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  changeStatusFieldsZodSchema,
  type IChangeStatusFormValues,
} from "@/zod/ticket.validation";
import { TICKET_STATUS_LABELS } from "@/types/enums.types";
import { TICKET_TRANSITIONS, type ITicket } from "@/types/ticket.types";

interface ChangeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: ITicket;
}

const DESCRIPTIONS: Record<string, string> = {
  REISSUED: "The ticket was reissued. Money is unchanged — record a date change for that.",
  REFUNDED: "The airline refunded the ticket. The refund reduces what the customer is charged.",
  VOID: "The ticket was voided before travel. Final.",
};

/**
 * Moves the ticket along its one-way lifecycle. Only transitions the backend's
 * TICKET_TRANSITIONS table allows are offered, so the dropdown cannot propose
 * a move the API would refuse.
 *
 * A refund is not inert here: the amount reduces the customer charge, which
 * reduces both their due and the recorded profit. In the old implementation a
 * refund was recorded and then excluded from every calculation, so a refunded
 * ticket still counted its full revenue and still showed the customer owing.
 */
const ChangeStatusDialog = ({ open, onOpenChange, ticket }: ChangeStatusDialogProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const allowed = TICKET_TRANSITIONS[ticket.status];

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IChangeStatusFormValues) =>
      changeTicketStatusAction(ticket.id, values),
  });

  // Annotated rather than `satisfies`, so the optional fields stay
  // `string | undefined` and match their optional zod validators.
  const defaultValues: IChangeStatusFormValues = {
    status: (allowed[0] ?? "VOID") as IChangeStatusFormValues["status"],
    refundAmount: "",
    note: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Failed to change status");
        return;
      }

      toast.success(result.message || "Status updated");
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["ticket", ticket.id] });
      // A refund changes the customer charge, so the due and profit both move.
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      void queryClient.refetchQueries({ queryKey: ["tickets"], type: "active" });
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
          <DialogTitle>Change ticket status</DialogTitle>
          <DialogDescription>
            PNR {ticket.pnr} is currently {TICKET_STATUS_LABELS[ticket.status]}. This lifecycle
            is one-way.
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
          <form.Field name="status">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>New status</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(next) =>
                    field.handleChange(next as IChangeStatusFormValues["status"])
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Only what the transition table permits from here. */}
                    {allowed.map((status) => (
                      <SelectItem key={status} value={status}>
                        {TICKET_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {DESCRIPTIONS[field.state.value]}
                </p>
              </div>
            )}
          </form.Field>

          {/* Only a refund takes an amount. */}
          <form.Subscribe selector={(state) => state.values.status}>
            {(status) =>
              status === "REFUNDED" ? (
                <>
                  <form.Field
                    name="refundAmount"
                    validators={{ onChange: changeStatusFieldsZodSchema.shape.refundAmount }}
                  >
                    {(field) => (
                      <AppField
                        field={field}
                        label="Refund amount"
                        placeholder="0.00"
                        disabled={isPending}
                        prepend={<span className="text-sm">৳</span>}
                        hint="What goes back to the customer. Reduces the charge, the due and the profit."
                      />
                    )}
                  </form.Field>

                  <form.Subscribe selector={(state) => state.values.refundAmount}>
                    {(refundAmount) => {
                      const refund = toNumber(refundAmount);
                      if (refund <= 0) return null;

                      const newCharge = ticket.customerCharge - refund;
                      const newProfit = newCharge - ticket.supplierCost;

                      return (
                        <dl className="space-y-1 rounded-md border bg-muted/40 p-3 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Customer charged</dt>
                            <dd className="tabular-nums">{formatCurrency(newCharge)}</dd>
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
                          {newCharge < ticket.totalPaid && (
                            <p className="pt-1 text-xs text-warning">
                              This leaves {formatCurrency(ticket.totalPaid - newCharge)} paid
                              beyond the charge — the customer will show a credit.
                            </p>
                          )}
                        </dl>
                      );
                    }}
                  </form.Subscribe>
                </>
              ) : null
            }
          </form.Subscribe>

          <form.Field name="note">
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
                  placeholder="Why the status changed..."
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Kept in the ticket&apos;s status history.
                </p>
              </div>
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
                  pendingLabel="Updating..."
                  disabled={!canSubmit}
                  className="w-auto"
                >
                  Change status
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeStatusDialog;
