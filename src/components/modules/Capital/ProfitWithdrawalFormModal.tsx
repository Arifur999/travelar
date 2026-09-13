"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProfitWithdrawalAction } from "@/app/(dashboardLayout)/dashboard/capital/_action";
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
  profitWithdrawalFieldsZodSchema,
  type IProfitWithdrawalFormValues,
} from "@/zod/capital.validation";

interface ProfitWithdrawalFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Profit taken out, kept apart from a capital withdrawal.
 *
 * Both reduce cash, but only a capital withdrawal reduces the owner's stake —
 * so mixing the two would make every ownership share wrong.
 */
const ProfitWithdrawalFormModal = ({
  open,
  onOpenChange,
}: ProfitWithdrawalFormModalProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: accountsData } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
    enabled: open,
  });

  const accounts = (accountsData?.data.data ?? []).filter((account) => account.isActive);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IProfitWithdrawalFormValues) =>
      createProfitWithdrawalAction(values),
  });

  const defaultValues: IProfitWithdrawalFormValues = {
    receivedBy: "",
    amount: "",
    cashAccountId: "",
    date: "",
    note: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Failed to record withdrawal");
        return;
      }

      toast.success(result.message || "Profit withdrawal recorded");
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["profit-withdrawals"] });
      void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
      void queryClient.refetchQueries({ queryKey: ["profit-withdrawals"], type: "active" });
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
          <DialogTitle>Withdraw profit</DialogTitle>
          <DialogDescription>
            Profit taken out of the business. This does not reduce anyone&apos;s invested
            capital — record a capital withdrawal for that.
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
          <form.Field
            name="receivedBy"
            validators={{ onChange: profitWithdrawalFieldsZodSchema.shape.receivedBy }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Received by"
                placeholder="Who took the money"
                disabled={isPending}
              />
            )}
          </form.Field>

          <form.Field
            name="amount"
            validators={{ onChange: profitWithdrawalFieldsZodSchema.shape.amount }}
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

          <form.Field name="cashAccountId">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Paid from</Label>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  disabled={isPending}
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
                  Record withdrawal
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfitWithdrawalFormModal;
