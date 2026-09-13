"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createExpenseAction,
  updateExpenseAction,
} from "@/app/(dashboardLayout)/dashboard/expenses/_action";
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
import { formatCurrency, formatDateForInput, toNumber } from "@/lib/format";
import { getCashAccounts } from "@/services/account.services";
import { getExpenseCategories } from "@/services/expense.services";
import {
  expenseFieldsZodSchema,
  type IExpenseFormValues,
} from "@/zod/expense.validation";
import { type IExpense } from "@/types/expense.types";

interface ExpenseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: IExpense | null;
}

const ExpenseFormModal = ({ open, onOpenChange, expense }: ExpenseFormModalProps) => {
  const isEdit = Boolean(expense);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: categoriesData } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: () => getExpenseCategories(),
    enabled: open,
  });

  const { data: accountsData } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
    enabled: open,
  });

  const categories = categoriesData?.data ?? [];
  const accounts = (accountsData?.data.data ?? []).filter((account) => account.isActive);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IExpenseFormValues) => {
      if (isEdit && expense) {
        // Amount and account are deliberately not sent — they have already
        // posted to the ledger.
        return updateExpenseAction(expense.id, {
          categoryId: values.categoryId,
          date: values.date,
          notes: values.notes,
        });
      }
      return createExpenseAction(values);
    },
  });

  const defaultValues: IExpenseFormValues = expense
    ? {
        categoryId: expense.categoryId,
        cashAccountId: expense.cashAccountId,
        amount: String(toNumber(expense.amount)),
        date: formatDateForInput(expense.date),
        notes: expense.notes ?? "",
      }
    : { categoryId: "", cashAccountId: "", amount: "", date: "", notes: "" };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Expense updated" : "Expense recorded"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expense-dashboard"] });
      // Money left an account, so the balances moved too.
      void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
      void queryClient.refetchQueries({ queryKey: ["expenses"], type: "active" });
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
          <DialogTitle>{isEdit ? "Edit expense" : "Record expense"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "The amount and account are fixed once posted — only the category, date and notes can change."
              : "Takes money out of the account you pick and counts against the category's budget."}
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
          <form.Field name="categoryId">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Category</Label>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  disabled={isPending}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Pick a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{
                              backgroundColor: category.color ?? "var(--muted-foreground)",
                            }}
                            aria-hidden="true"
                          />
                          {category.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categories.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No categories yet — add one first.
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {isEdit ? (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p>
                {formatCurrency(expense?.amount)} paid from{" "}
                <span className="font-medium">{expense?.cashAccount.name}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Fixed once posted. To correct either, delete this expense and record it again —
                that reverses the posting cleanly.
              </p>
            </div>
          ) : (
            <>
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

              <form.Field
                name="amount"
                validators={{ onChange: expenseFieldsZodSchema.shape.amount }}
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
            </>
          )}

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

          <form.Field name="notes">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Notes</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  rows={2}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="What it was for..."
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
                  pendingLabel={isEdit ? "Saving..." : "Recording..."}
                  disabled={!canSubmit}
                  className="w-auto"
                >
                  {isEdit ? "Save changes" : "Record expense"}
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseFormModal;
