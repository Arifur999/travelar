"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBalanceTransferAction } from "@/app/(dashboardLayout)/dashboard/transfers/_action";
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
import { formatCurrency } from "@/lib/format";
import { getCashAccounts } from "@/services/account.services";
import {
  balanceTransferFieldsZodSchema,
  createBalanceTransferFormZodSchema,
  type ICreateBalanceTransferFormValues,
} from "@/zod/account.validation";

interface TransferFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyValues: ICreateBalanceTransferFormValues = {
  fromAccountId: "",
  toAccountId: "",
  amount: "",
  date: "",
  note: "",
};

/**
 * Create only.
 *
 * A posted transfer has already moved two balances, so its amount and accounts
 * are immutable — correcting one means deleting it (which reverses both
 * postings) and recording it again. Editing the date or note happens inline
 * from the table instead.
 */
const TransferFormModal = ({ open, onOpenChange }: TransferFormModalProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Shares the cash-accounts cache with the accounts page, so opening this
  // modal usually costs no request at all.
  const { data: accountsData } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
    enabled: open,
  });

  // Only active accounts — an archived one cannot take new movements.
  const accounts = (accountsData?.data.data ?? []).filter((account) => account.isActive);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ICreateBalanceTransferFormValues) =>
      createBalanceTransferAction(values),
  });

  const form = useForm({
    defaultValues: emptyValues,
    onSubmit: async ({ value }) => {
      // The same-account rule spans two fields, so it cannot hang off a single
      // field validator.
      const parsed = createBalanceTransferFormZodSchema.safeParse(value);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Please check the form");
        return;
      }

      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Failed to record transfer");
        return;
      }

      toast.success(result.message || "Transfer recorded");
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["balance-transfers"] });
      // Both balances moved, so the account list and the dashboard are stale.
      void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
      void queryClient.refetchQueries({ queryKey: ["balance-transfers"], type: "active" });
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
          <DialogTitle>Transfer between accounts</DialogTitle>
          <DialogDescription>
            Moves money between your own accounts. This is the one movement that is refused if
            it would overdraw the source.
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
          <form.Field name="fromAccountId">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>From</Label>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  disabled={isPending}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Pick the source account" />
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
          </form.Field>

          <form.Field name="toAccountId">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>To</Label>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  disabled={isPending}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Pick the destination account" />
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
          </form.Field>

          <form.Field
            name="amount"
            validators={{ onChange: balanceTransferFieldsZodSchema.shape.amount }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Amount"
                placeholder="0.00"
                disabled={isPending}
                prepend={<span className="text-sm">৳</span>}
              />
            )}
          </form.Field>

          <form.Field name="date">
            {(field) => (
              <AppField
                field={field}
                label="Date"
                type="date"
                disabled={isPending}
                hint="Defaults to today."
              />
            )}
          </form.Field>

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
                  placeholder="Why the money moved..."
                  disabled={isPending}
                />
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
                  pendingLabel="Recording..."
                  disabled={!canSubmit}
                  className="w-auto"
                >
                  Record transfer
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferFormModal;
