"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createAttendanceAction } from "@/app/(dashboardLayout)/dashboard/employees/_action";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { employeeOptions } from "@/lib/pickerOptions";
import { getEmployeeDashboard } from "@/services/employee.services";
import {
  attendanceFieldsZodSchema,
  type IAttendanceFormValues,
} from "@/zod/employee.validation";
import {
  ATTENDANCE_STATUS_OPTIONS,
  type AttendanceStatus,
} from "@/types/enums.types";

interface AttendanceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AttendanceFormModal = ({ open, onOpenChange }: AttendanceFormModalProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: employeesData } = useQuery({
    queryKey: ["employee-dashboard"],
    queryFn: () => getEmployeeDashboard(),
    enabled: open,
  });

  const employees = (employeesData?.data.data ?? []).filter((item) => item.isActive);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IAttendanceFormValues) => createAttendanceAction(values),
  });

  const defaultValues: IAttendanceFormValues = {
    employeeId: "",
    date: "",
    status: "PRESENT",
    startTime: "",
    endTime: "",
    note: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        // One row per employee per day — a duplicate is refused by a unique
        // constraint, and that message says so.
        toast.error(result.message || "Failed to record attendance");
        return;
      }

      toast.success(result.message || "Attendance recorded");
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["attendance"] });
      void queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
      void queryClient.refetchQueries({ queryKey: ["attendance"], type: "active" });
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
          <DialogTitle>Record attendance</DialogTitle>
          <DialogDescription>
            One entry per employee per day. Hours are worked out from the two times.
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
                <SearchableSelect
                  id={field.name}
                  value={field.state.value}
                  onChange={field.handleChange}
                  options={employeeOptions(employees)}
                  placeholder="Pick an employee"
                  searchPlaceholder="Search by name or phone…"
                  emptyText="No employee matches."
                  loading={!employeesData}
                  disabled={isPending}
                />
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="date"
              validators={{ onChange: attendanceFieldsZodSchema.shape.date }}
            >
              {(field) => (
                <AppField field={field} label="Date" type="date" disabled={isPending} />
              )}
            </form.Field>

            <form.Field name="status">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Status</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(next) => field.handleChange(next as AttendanceStatus)}
                    disabled={isPending}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          {/* Times only make sense on a day someone was here. */}
          <form.Subscribe selector={(state) => state.values.status}>
            {(status) =>
              status === "PRESENT" ? (
                <div className="grid grid-cols-2 gap-3">
                  <form.Field
                    name="startTime"
                    validators={{ onChange: attendanceFieldsZodSchema.shape.startTime }}
                  >
                    {(field) => (
                      <AppField
                        field={field}
                        label="Start"
                        placeholder="09:30 AM"
                        disabled={isPending}
                      />
                    )}
                  </form.Field>

                  <form.Field
                    name="endTime"
                    validators={{ onChange: attendanceFieldsZodSchema.shape.endTime }}
                  >
                    {(field) => (
                      <AppField
                        field={field}
                        label="End"
                        placeholder="06:00 PM"
                        disabled={isPending}
                      />
                    )}
                  </form.Field>
                </div>
              ) : null
            }
          </form.Subscribe>

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
                  Record
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceFormModal;
