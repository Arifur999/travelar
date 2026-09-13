"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCapitalFlowAction } from "@/app/(dashboardLayout)/dashboard/capital/_action";
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
import { getCashAccounts } from "@/services/account.services";
import { getCapitalSummary } from "@/services/capital.services";
import {
  capitalFlowFieldsZodSchema,
  type ICapitalFlowFormValues,
} from "@/zod/capital.validation";
import { CAPITAL_FLOW_TYPE_OPTIONS, type CapitalFlowType } from "@/types/enums.types";

interface CapitalFlowFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Owner capital in or out.
 *
 * A WITHDRAW here is different from a profit withdrawal: this one reduces what
 * the owner has invested, so it changes their share of the business. Taking
 * profit does not give back any of the stake, which is why the API keeps them
 * as separate entities and the source spreadsheet as separate columns.
 */
const CapitalFlowFormModal = ({ open, onOpenChange }: CapitalFlowFormModalProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: accountsData } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
    enabled: open,
  });

  // Existing owner names, so a second entry for the same person does not end up
  // under a slightly different spelling and split their totals in two.
  const { data: summaryData } = useQuery({
    queryKey: ["capital-summary"],
    queryFn: () => getCapitalSummary(),
    enabled: open,
  });

  const accounts = (accountsData?.data.data ?? []).filter((account) => account.isActive);
  const knownOwners = summaryData?.data.owners ?? [];

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ICapitalFlowFormValues) => createCapitalFlowAction(values),
  });

  const defaultValues: ICapitalFlowFormValues = {
    ownerName: "",
    type: "INVEST",
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
        toast.error(result.message || "Failed to record entry");
        return;
      }

      toast.success(result.message || "Capital entry recorded");
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["capital-flows"] });
      void queryClient.invalidateQueries({ queryKey: ["capital-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
      void queryClient.refetchQueries({ queryKey: ["capital-flows"], type: "active" });
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
          <DialogTitle>Record capital</DialogTitle>
          <DialogDescription>
            Money an owner puts into or takes out of the business. This is the stake, not profit
            — taking profit is recorded separately.
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
            name="ownerName"
            validators={{ onChange: capitalFlowFieldsZodSchema.shape.ownerName }}
          >
            {(field) => (
              <div className="space-y-1.5">
                <AppField
                  field={field}
                  label="Owner"
                  placeholder="Full name"
                  disabled={isPending}
                  hint="Owners are grouped by this name, so keep the spelling consistent."
                />
                {knownOwners.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {knownOwners.map((owner) => (
                      <Button
                        key={owner.ownerName}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => field.handleChange(owner.ownerName)}
                        disabled={isPending}
                      >
                        {owner.ownerName}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="type">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Direction</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(next) => field.handleChange(next as CapitalFlowType)}
                  disabled={isPending}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPITAL_FLOW_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {field.state.value === "INVEST"
                    ? "Money in — increases the owner's stake and the account balance."
                    : "Money out — reduces the owner's stake as well as the account balance."}
                </p>
              </div>
            )}
          </form.Field>

          <form.Field
            name="amount"
            validators={{ onChange: capitalFlowFieldsZodSchema.shape.amount }}
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
                <Label htmlFor={field.name}>Account</Label>
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

          {/* The API guards only transfers between the agency's own accounts, so a
              withdrawal larger than the balance is accepted and takes the account
              negative. Warn with the resulting figure rather than blocking, since
              the backend deliberately allows it. */}
          <form.Subscribe
            selector={(state) =>
              [state.values.type, state.values.amount, state.values.cashAccountId] as const
            }
          >
            {([type, amount, accountId]) => {
              if (type !== "WITHDRAW") return null;
              const account = accounts.find((item) => item.id === accountId);
              if (!account) return null;

              const resulting = account.currentBalance - toNumber(amount);
              if (resulting >= 0) return null;

              return (
                <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs">
                  This is more than {account.name} holds ({formatCurrency(account.currentBalance)}).
                  It will be recorded and leave the account at{" "}
                  <span className="font-medium">{formatCurrency(resulting)}</span>.
                </p>
              );
            }}
          </form.Subscribe>

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
                  Record entry
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CapitalFlowFormModal;
