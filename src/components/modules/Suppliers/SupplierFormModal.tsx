"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createSupplierAction,
  updateSupplierAction,
} from "@/app/(dashboardLayout)/dashboard/suppliers/_action";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createSupplierFormZodSchema,
  type ICreateSupplierFormValues,
} from "@/zod/supplier.validation";
import { type ISupplier } from "@/types/supplier.types";

interface SupplierFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: ISupplier | null;
}

const emptyValues: ICreateSupplierFormValues = {
  name: "",
  contactName: "",
  phone: "",
  address: "",
  openingPayable: "",
};

const SupplierFormModal = ({ open, onOpenChange, supplier }: SupplierFormModalProps) => {
  const isEdit = Boolean(supplier);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ICreateSupplierFormValues) =>
      isEdit && supplier
        ? updateSupplierAction(supplier.id, values)
        : createSupplierAction(values),
  });

  const form = useForm({
    defaultValues: supplier
      ? {
          name: supplier.name,
          contactName: supplier.contactName ?? "",
          phone: supplier.phone ?? "",
          address: supplier.address ?? "",
          openingPayable: String(supplier.openingPayable),
        }
      : emptyValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Supplier updated" : "Supplier created"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      void queryClient.invalidateQueries({ queryKey: ["supplier-dashboard"] });
      void queryClient.refetchQueries({ queryKey: ["suppliers"], type: "active" });
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
          <DialogTitle>{isEdit ? "Edit supplier" : "Add supplier"}</DialogTitle>
          <DialogDescription>
            Who you buy tickets and services from. A ticket references the supplier, which is
            what makes its cost accrue against what you owe them.
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
            validators={{ onChange: createSupplierFormZodSchema.shape.name }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Supplier name"
                placeholder="e.g. Sky Consolidator Ltd"
                disabled={isPending}
                hint="Must be unique within your agency."
              />
            )}
          </form.Field>

          <form.Field
            name="contactName"
            validators={{ onChange: createSupplierFormZodSchema.shape.contactName }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Contact person"
                placeholder="Who you deal with"
                disabled={isPending}
                hint="Optional"
              />
            )}
          </form.Field>

          <form.Field
            name="phone"
            validators={{ onChange: createSupplierFormZodSchema.shape.phone }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Phone"
                type="tel"
                placeholder="01XXXXXXXXX"
                disabled={isPending}
                hint="Optional"
              />
            )}
          </form.Field>

          <form.Field
            name="openingPayable"
            validators={{ onChange: createSupplierFormZodSchema.shape.openingPayable }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Opening payable"
                placeholder="0.00"
                disabled={isPending}
                prepend={<span className="text-sm">৳</span>}
                hint="What you already owed when you started tracking. Negative means an advance is sitting with them."
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
                  {isEdit ? "Save changes" : "Add supplier"}
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierFormModal;
