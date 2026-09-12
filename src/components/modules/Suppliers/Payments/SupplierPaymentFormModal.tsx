"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSupplierPaymentAction } from "@/app/(dashboardLayout)/dashboard/supplier-payments/_action";
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
import { getSupplierDashboard } from "@/services/supplier.services";
import {
  supplierPaymentFieldsZodSchema,
  type ICreateSupplierPaymentFormValues,
} from "@/zod/supplier.validation";

interface SupplierPaymentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selects the supplier when opened from their row. */
  defaultSupplierId?: string;
}

const emptyValues: ICreateSupplierPaymentFormValues = {
  supplierId: "",
  cashAccountId: "",
  amount: "",
  date: "",
  note: "",
};

/**
 * Create only — a posted payment has already moved an account balance, so
 * correcting the amount or account means deleting it (which reverses the
 * posting) and recording it again.
 *
 * Deliberately NOT guarded against over-payment. The API allows a supplier
 * payable to go negative because paying an advance is a real workflow, and
 * blocking it here would make the UI stricter than the business.
 */
const SupplierPaymentFormModal = ({
  open,
  onOpenChange,
  defaultSupplierId,
}: SupplierPaymentFormModalProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: suppliersData } = useQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: () => getSupplierDashboard(),
    enabled: open,
  });

  const { data: accountsData } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
    enabled: open,
  });

  const suppliers = suppliersData?.data.data ?? [];
  // An archived account cannot take new movements.
  const accounts = (accountsData?.data.data ?? []).filter((account) => account.isActive);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ICreateSupplierPaymentFormValues) =>
      createSupplierPaymentAction(values),
  });

  const form = useForm({
    defaultValues: { ...emptyValues, supplierId: defaultSupplierId ?? "" },
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        // The API refuses a payment that would overdraw the source account and
        // names the available balance, so the message is shown as-is.
        toast.error(result.message || "Failed to record payment");
        return;
      }

      toast.success(result.message || "Payment recorded");
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
      // A payment moves the payable AND an account balance, so the supplier
      // list, its dashboard, every open ledger, the accounts list and the
      // balance dashboard are all stale.
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      void queryClient.invalidateQueries({ queryKey: ["supplier-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["supplier-ledger"] });
      void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
      void queryClient.refetchQueries({ queryKey: ["supplier-payments"], type: "active" });
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
          <DialogTitle>Pay a supplier</DialogTitle>
          <DialogDescription>
            Reduces what you owe and takes the money out of the account you pick.
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
          <form.Field name="supplierId">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Supplier</Label>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  disabled={isPending}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Pick a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                        {supplier.currentPayable !== 0 && (
                          <span className="text-muted-foreground">
                            {" "}
                            — {supplier.currentPayable > 0 ? "owed" : "advance"}{" "}
                            {formatCurrency(Math.abs(supplier.currentPayable))}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="cashAccountId">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Pay from</Label>
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

          <form.Field
            name="amount"
            validators={{ onChange: supplierPaymentFieldsZodSchema.shape.amount }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Amount"
                placeholder="0.00"
                disabled={isPending}
                prepend={<span className="text-sm">৳</span>}
                hint="Paying more than you owe is allowed — it becomes an advance."
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
                  placeholder="Cheque number, what it settles..."
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

export default SupplierPaymentFormModal;
