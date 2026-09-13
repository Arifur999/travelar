"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPayoutAction } from "@/app/(dashboardLayout)/dashboard/employees/_action";
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
import { getEmployeeDashboard } from "@/services/employee.services";
import {
  payoutFieldsZodSchema,
  type IPayoutFormValues,
} from "@/zod/employee.validation";
import {
  EMPLOYEE_PAYOUT_TYPE_OPTIONS,
  type EmployeePayoutType,
} from "@/types/enums.types";

interface PayoutFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PayoutFormModal = ({ open, onOpenChange }: PayoutFormModalProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: employeesData } = useQuery({
    queryKey: ["employee-dashboard"],
    queryFn: () => getEmployeeDashboard(),
    enabled: open,
  });

  const { data: accountsData } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
    enabled: open,
  });

  // Only people who still work here — paying a resigned employee is almost
  // always a mistyped name.
  const employees = (employeesData?.data.data ?? []).filter((item) => item.isActive);
  const accounts = (accountsData?.data.data ?? []).filter((account) => account.isActive);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IPayoutFormValues) => createPayoutAction(values),
  });

  const defaultValues: IPayoutFormValues = {
    employeeId: "",
    cashAccountId: "",
    type: "SALARY",
    amount: "",
    totalDays: "",
    date: "",
    note: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Failed to record payout");
        return;
      }

      toast.success(result.message || "Payout recorded");
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["employee-payouts"] });
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["employee-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
      void queryClient.refetchQueries({ queryKey: ["employee-payouts"], type: "active" });
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
          <DialogTitle>Pay an employee</DialogTitle>
          <DialogDescription>
            Takes money out of the account you pick. Salary and bonus are totalled separately.
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
          <form.Field name="employeeId">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Employee</Label>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  disabled={isPending}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Pick an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} — {employee.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {employees.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No active employees. Add one, or clear a resign date.
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="type">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Type</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(next) => field.handleChange(next as EmployeePayoutType)}
                  disabled={isPending}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_PAYOUT_TYPE_OPTIONS.map((option) => (
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
            name="amount"
            validators={{ onChange: payoutFieldsZodSchema.shape.amount }}
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

          {/* Days covered only mean something on a salary payment. */}
          <form.Subscribe selector={(state) => state.values.type}>
            {(type) =>
              type === "SALARY" ? (
                <form.Field
                  name="totalDays"
                  validators={{ onChange: payoutFieldsZodSchema.shape.totalDays }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Days covered"
                      type="number"
                      placeholder="30"
                      disabled={isPending}
                      hint="Optional — which period this salary is for."
                    />
                  )}
                </form.Field>
              ) : null
            }
          </form.Subscribe>

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

          {/* The API guards only transfers against overdrawing, so warn rather
              than block — same policy as an expense or a capital withdrawal. */}
          <form.Subscribe
            selector={(state) => [state.values.amount, state.values.cashAccountId] as const}
          >
            {([amount, accountId]) => {
              const account = accounts.find((item) => item.id === accountId);
              if (!account) return null;

              const resulting = account.currentBalance - toNumber(amount);
              if (resulting >= 0) return null;

              return (
                <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs">
                  More than {account.name} holds ({formatCurrency(account.currentBalance)}). It
                  will be recorded and leave the account at{" "}
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
                  Record payout
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutFormModal;
