"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/app/(dashboardLayout)/dashboard/customers/_action";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  createCustomerFormZodSchema,
  type ICreateCustomerFormValues,
} from "@/zod/customer.validation";
import { type ICustomer } from "@/types/customer.types";

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: ICustomer | null;
}

const emptyValues: ICreateCustomerFormValues = {
  name: "",
  phone: "",
  email: "",
  passportNo: "",
  address: "",
  note: "",
  openingDue: "",
};

const CustomerFormModal = ({ open, onOpenChange, customer }: CustomerFormModalProps) => {
  const isEdit = Boolean(customer);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ICreateCustomerFormValues) =>
      isEdit && customer
        ? updateCustomerAction(customer.id, values)
        : createCustomerAction(values),
  });

  const form = useForm({
    defaultValues: customer
      ? {
          name: customer.name,
          phone: customer.phone,
          email: customer.email ?? "",
          passportNo: customer.passportNo ?? "",
          address: customer.address ?? "",
          note: customer.note ?? "",
          openingDue: String(customer.openingDue),
        }
      : emptyValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Customer updated" : "Customer created"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      void queryClient.refetchQueries({ queryKey: ["customers"], type: "active" });
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
        className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-md"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>{isEdit ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>
            Every ticket, visa case and Hajj booking bills a customer, which is what makes the
            due balance add up across all three.
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
              <form.Field
                name="name"
                validators={{ onChange: createCustomerFormZodSchema.shape.name }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Name"
                    placeholder="Full name as on the passport"
                    disabled={isPending}
                  />
                )}
              </form.Field>

              <form.Field
                name="phone"
                validators={{ onChange: createCustomerFormZodSchema.shape.phone }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Phone"
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    disabled={isPending}
                    hint="Must be unique within your agency — it is how a returning customer is recognised."
                  />
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <AppField
                    field={field}
                    label="Email"
                    type="email"
                    placeholder="name@example.com"
                    disabled={isPending}
                    hint="Optional"
                  />
                )}
              </form.Field>

              <form.Field
                name="passportNo"
                validators={{ onChange: createCustomerFormZodSchema.shape.passportNo }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Passport number"
                    placeholder="A01234567"
                    disabled={isPending}
                    hint="Optional"
                    className="font-mono uppercase"
                  />
                )}
              </form.Field>

              <form.Field
                name="openingDue"
                validators={{ onChange: createCustomerFormZodSchema.shape.openingDue }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Opening due"
                    placeholder="0.00"
                    disabled={isPending}
                    prepend={<span className="text-sm">৳</span>}
                    hint="What they already owed when you started tracking. Negative means they are in credit."
                  />
                )}
              </form.Field>

              <form.Field name="address">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Address</Label>
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
                      placeholder="Anything worth remembering about this customer..."
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
                      pendingLabel={isEdit ? "Saving..." : "Adding..."}
                      disabled={!canSubmit}
                      className="w-auto"
                    >
                      {isEdit ? "Save changes" : "Add customer"}
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

export default CustomerFormModal;
