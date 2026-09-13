"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createEmployeeAction,
  updateEmployeeAction,
} from "@/app/(dashboardLayout)/dashboard/employees/_action";
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
import { formatDateForInput } from "@/lib/format";
import {
  employeeFieldsZodSchema,
  employeeFormZodSchema,
  type IEmployeeFormValues,
} from "@/zod/employee.validation";
import { type IEmployee } from "@/types/employee.types";

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: IEmployee | null;
}

const EmployeeFormModal = ({ open, onOpenChange, employee }: EmployeeFormModalProps) => {
  const isEdit = Boolean(employee);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IEmployeeFormValues) =>
      isEdit && employee
        ? // An empty resign date must be sent as null, not "", or the employee
          // stays marked resigned.
          updateEmployeeAction(employee.id, {
            ...values,
            resignDate: values.resignDate?.trim() ? values.resignDate : null,
          })
        : createEmployeeAction(values),
  });

  const defaultValues: IEmployeeFormValues = employee
    ? {
        name: employee.name,
        phone: employee.phone,
        address: employee.address ?? "",
        joinDate: formatDateForInput(employee.joinDate),
        resignDate: formatDateForInput(employee.resignDate),
      }
    : { name: "", phone: "", address: "", joinDate: "", resignDate: "" };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      // Cross-field: the resign date cannot precede the join date. The API
      // enforces it too, but catching it here avoids a round-trip.
      const parsed = employeeFormZodSchema.safeParse(value);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Please check the form");
        return;
      }

      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Employee updated" : "Employee added"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["employee-dashboard"] });
      void queryClient.refetchQueries({ queryKey: ["employees"], type: "active" });
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
          <DialogTitle>{isEdit ? "Edit employee" : "Add employee"}</DialogTitle>
          <DialogDescription>
            Whether someone still works here is decided by one thing — whether they have a
            resign date.
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
            validators={{ onChange: employeeFieldsZodSchema.shape.name }}
          >
            {(field) => (
              <AppField field={field} label="Name" placeholder="Full name" disabled={isPending} />
            )}
          </form.Field>

          <form.Field
            name="phone"
            validators={{ onChange: employeeFieldsZodSchema.shape.phone }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Phone"
                type="tel"
                placeholder="01XXXXXXXXX"
                disabled={isPending}
              />
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="joinDate"
              validators={{ onChange: employeeFieldsZodSchema.shape.joinDate }}
            >
              {(field) => (
                <AppField field={field} label="Join date" type="date" disabled={isPending} />
              )}
            </form.Field>

            <form.Field name="resignDate">
              {(field) => (
                <AppField
                  field={field}
                  label="Resign date"
                  type="date"
                  disabled={isPending}
                  hint="Leave blank while still employed."
                />
              )}
            </form.Field>
          </div>

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
                  {isEdit ? "Save changes" : "Add employee"}
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeFormModal;
