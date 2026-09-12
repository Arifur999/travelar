"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createCashAccountAction,
  updateCashAccountAction,
} from "@/app/(dashboardLayout)/dashboard/accounts/_action";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  createCashAccountFormZodSchema,
  type ICreateCashAccountFormValues,
} from "@/zod/account.validation";
import { type IAccountBalance } from "@/types/account.types";
import {
  CASH_ACCOUNT_CATEGORY_OPTIONS,
  type CashAccountCategory,
} from "@/types/enums.types";

interface CashAccountFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: IAccountBalance | null;
}

const emptyValues: ICreateCashAccountFormValues = {
  name: "",
  category: "SALES_BUYING",
  openingBalance: "",
  isActive: true,
};

const CashAccountFormModal = ({ open, onOpenChange, account }: CashAccountFormModalProps) => {
  const isEdit = Boolean(account);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ICreateCashAccountFormValues) => {
      if (isEdit && account) {
        // openingBalance is deliberately not sent: it already wrote an OPENING
        // posting, so changing it would rewrite the ledger silently.
        return updateCashAccountAction(account.id, {
          name: values.name,
          category: values.category,
          isActive: values.isActive,
        });
      }
      return createCashAccountAction(values);
    },
  });

  const form = useForm({
    defaultValues: account
      ? {
          name: account.name,
          category: account.category,
          openingBalance: String(account.openingBalance),
          isActive: account.isActive,
        }
      : emptyValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Account updated" : "Account created"));
      onOpenChange(false);
      form.reset();
      // Both keys: the list and the Balance Dashboard read the same ledger, so
      // a new account or a changed opening balance moves both.
      void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
      void queryClient.refetchQueries({ queryKey: ["cash-accounts"], type: "active" });
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
          <DialogTitle>{isEdit ? "Edit account" : "Add cash account"}</DialogTitle>
          <DialogDescription>
            Every payment, expense and transfer posts against one of these, so the balance is
            always the sum of its ledger.
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
            name="name"
            validators={{ onChange: createCashAccountFormZodSchema.shape.name }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Account name"
                placeholder="e.g. Cash in hand, City Bank current"
                disabled={isPending}
              />
            )}
          </form.Field>

          <form.Field name="category">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Category</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(next) => field.handleChange(next as CashAccountCategory)}
                  disabled={isPending}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CASH_ACCOUNT_CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          {isEdit ? (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">
                Opening balance is fixed at{" "}
                <span className="font-medium text-foreground">{account?.openingBalance}</span>.
                It was written to the ledger when the account was created — correct it with an
                adjustment rather than an edit, so the history stays intact.
              </p>
            </div>
          ) : (
            <form.Field
              name="openingBalance"
              validators={{ onChange: createCashAccountFormZodSchema.shape.openingBalance }}
            >
              {(field) => (
                <AppField
                  field={field}
                  label="Opening balance"
                  placeholder="0.00"
                  disabled={isPending}
                  prepend={<span className="text-sm">৳</span>}
                  hint="Optional, and fixed once saved. May be negative for a loan or card account."
                />
              )}
            </form.Field>
          )}

          <form.Field name="isActive">
            {(field) => (
              <div className="flex items-start gap-2">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                  disabled={isPending}
                />
                <div className="space-y-0.5">
                  <Label htmlFor={field.name} className="font-normal">
                    Active
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    An archived account keeps its history but is left out of the headline
                    balance and cannot be picked for new payments.
                  </p>
                </div>
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
                  pendingLabel={isEdit ? "Saving..." : "Adding..."}
                  disabled={!canSubmit}
                  className="w-auto"
                >
                  {isEdit ? "Save changes" : "Add account"}
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CashAccountFormModal;
