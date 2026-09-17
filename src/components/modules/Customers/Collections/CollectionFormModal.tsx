"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createDueReceiptAction } from "@/app/(dashboardLayout)/dashboard/collections/_action";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import SearchableSelect from "@/components/shared/form/SearchableSelect";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, toNumber } from "@/lib/format";
import { customerOptions } from "@/lib/pickerOptions";
import { getCashAccounts } from "@/services/account.services";
import { getCustomerDashboard } from "@/services/customer.services";
import {
  createDueReceiptFormZodSchema,
  dueReceiptFieldsZodSchema,
  type ICreateDueReceiptFormValues,
} from "@/zod/customer.validation";

interface CollectionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCustomerId?: string;
}

const emptyValues: ICreateDueReceiptFormValues = {
  customerId: "",
  cashAccount1Id: "",
  amount1: "",
  cashAccount2Id: "",
  amount2: "",
  discount: "",
  discountCategory: "",
  date: "",
  notes: "",
};

/**
 * Create only — a posted receipt has moved one or two account balances.
 *
 * Deliberately NOT capped at the customer's outstanding due. Over-collection
 * is allowed and shows as a credit, because taking a deposit before a booking
 * is a normal workflow; the guard belongs on invoice-level payments, not here.
 */
const CollectionFormModal = ({
  open,
  onOpenChange,
  defaultCustomerId,
}: CollectionFormModalProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showSplit, setShowSplit] = useState(false);

  const { data: customersData } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
    enabled: open,
  });

  const { data: accountsData } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
    enabled: open,
  });

  const customers = customersData?.data.data ?? [];
  const accounts = (accountsData?.data.data ?? []).filter((account) => account.isActive);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ICreateDueReceiptFormValues) => createDueReceiptAction(values),
  });

  const form = useForm({
    defaultValues: { ...emptyValues, customerId: defaultCustomerId ?? "" },
    onSubmit: async ({ value }) => {
      // Three cross-field rules (accounts differ, a second account needs an
      // amount, a second amount needs an account) — none can hang off a single
      // field validator.
      const parsed = createDueReceiptFormZodSchema.safeParse(value);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Please check the form");
        return;
      }

      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Failed to record collection");
        return;
      }

      toast.success(
        `Received ${formatCurrency(result.data.totalReceived)} — due now ${formatCurrency(result.data.customerDue)}`,
      );
      onOpenChange(false);
      form.reset();
      setShowSplit(false);
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
      // A receipt moves the customer's due AND one or two account balances.
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
      void queryClient.refetchQueries({ queryKey: ["collections"], type: "active" });
      router.refresh();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          form.reset();
          setShowSplit(false);
        }
      }}
    >
      <DialogContent
        className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-md"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>Receive money</DialogTitle>
          <DialogDescription>
            Collected against the customer&apos;s overall balance rather than one specific sale.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="px-6 py-5">
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
              <form.Field name="customerId">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Customer</Label>
                    <SearchableSelect
                      id={field.name}
                      value={field.state.value}
                      onChange={field.handleChange}
                      options={customerOptions(customers, { showDue: true })}
                      placeholder="Pick a customer"
                      searchPlaceholder="Search by name, phone or passport…"
                      emptyText="No customer matches."
                      loading={!customersData}
                      disabled={isPending}
                    />
                  </div>
                )}
              </form.Field>

              <div className="space-y-4 rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground">Money in</p>

                <form.Field name="cashAccount1Id">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Into account</Label>
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
                  name="amount1"
                  validators={{ onChange: dueReceiptFieldsZodSchema.shape.amount1 }}
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

                {/* Split tender: part cash, part bank, in one receipt. */}
                {showSplit ? (
                  <>
                    <form.Field name="cashAccount2Id">
                      {(field) => (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={field.name}>Second account</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setShowSplit(false);
                                field.handleChange("");
                                form.setFieldValue("amount2", "");
                              }}
                            >
                              <X className="size-3" aria-hidden="true" />
                              Remove
                            </Button>
                          </div>
                          <Select
                            value={field.state.value}
                            onValueChange={field.handleChange}
                            disabled={isPending}
                          >
                            <SelectTrigger id={field.name} className="w-full">
                              <SelectValue placeholder="Pick a different account" />
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
                      name="amount2"
                      validators={{ onChange: dueReceiptFieldsZodSchema.shape.amount2 }}
                    >
                      {(field) => (
                        <AppField
                          field={field}
                          label="Second amount"
                          placeholder="0.00"
                          disabled={isPending}
                          prepend={<span className="text-sm">৳</span>}
                        />
                      )}
                    </form.Field>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSplit(true)}
                    disabled={isPending}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Split across two accounts
                  </Button>
                )}

                <form.Subscribe
                  selector={(state) => [state.values.amount1, state.values.amount2] as const}
                >
                  {([amount1, amount2]) => {
                    const total = toNumber(amount1) + toNumber(amount2);
                    if (total <= 0) return null;
                    return (
                      <p className="text-sm">
                        Total received{" "}
                        <span className="font-medium">{formatCurrency(total)}</span>
                      </p>
                    );
                  }}
                </form.Subscribe>
              </div>

              <div className="space-y-4 rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Discount — reduces the due without any money moving
                </p>

                <form.Field
                  name="discount"
                  validators={{ onChange: dueReceiptFieldsZodSchema.shape.discount }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Discount"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                      hint="Optional. Posts to no account — it only writes off part of the balance."
                    />
                  )}
                </form.Field>

                <form.Field
                  name="discountCategory"
                  validators={{ onChange: dueReceiptFieldsZodSchema.shape.discountCategory }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Discount reason"
                      placeholder="e.g. Goodwill, Rounding"
                      disabled={isPending}
                      hint="Optional"
                    />
                  )}
                </form.Field>
              </div>

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
                      placeholder="Receipt number, what it settles..."
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

                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                >
                  {([canSubmit, isSubmitting]) => (
                    <AppSubmitButton
                      isPending={isSubmitting || isPending}
                      pendingLabel="Recording..."
                      disabled={!canSubmit}
                      className="w-auto"
                    >
                      Record receipt
                    </AppSubmitButton>
                  )}
                </form.Subscribe>
              </DialogFooter>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionFormModal;
