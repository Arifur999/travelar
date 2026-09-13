"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createHajjBatchAction,
  updateHajjBatchAction,
} from "@/app/(dashboardLayout)/dashboard/hajj/_action";
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
import { formatDateForInput } from "@/lib/format";
import { getHajjPackages } from "@/services/hajj.services";
import {
  hajjBatchFieldsZodSchema,
  type IHajjBatchFormValues,
} from "@/zod/hajj.validation";
import { type IHajjBatch } from "@/types/hajj.types";

interface HajjBatchFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch?: IHajjBatch | null;
}

const HajjBatchFormModal = ({ open, onOpenChange, batch }: HajjBatchFormModalProps) => {
  const isEdit = Boolean(batch);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: packagesData } = useQuery({
    queryKey: ["hajj-packages"],
    queryFn: () => getHajjPackages("limit=200"),
    enabled: open,
  });

  const packages = packagesData?.data ?? [];

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IHajjBatchFormValues) =>
      isEdit && batch ? updateHajjBatchAction(batch.id, values) : createHajjBatchAction(values),
  });

  const defaultValues: IHajjBatchFormValues = batch
    ? {
        packageId: batch.packageId,
        name: batch.name,
        departureDate: formatDateForInput(batch.departureDate),
        returnDate: formatDateForInput(batch.returnDate),
        seatCapacity: String(batch.seatCapacity),
      }
    : {
        packageId: "",
        name: "",
        departureDate: "",
        returnDate: "",
        seatCapacity: "",
      };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Batch updated" : "Batch created"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["hajj-batches"] });
      void queryClient.invalidateQueries({ queryKey: ["hajj-batch-summary"] });
      void queryClient.refetchQueries({ queryKey: ["hajj-batches"], type: "active" });
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
          <DialogTitle>{isEdit ? "Edit batch" : "New batch"}</DialogTitle>
          <DialogDescription>
            A departure group. Seats count live bookings only, so a cancelled pilgrim frees
            their place.
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
          <form.Field name="packageId">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Package</Label>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  disabled={isPending}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Pick a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field
            name="name"
            validators={{ onChange: hajjBatchFieldsZodSchema.shape.name }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Batch name"
                placeholder="e.g. Ramadan 2027 Group A"
                disabled={isPending}
              />
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="departureDate"
              validators={{ onChange: hajjBatchFieldsZodSchema.shape.departureDate }}
            >
              {(field) => (
                <AppField field={field} label="Departs" type="date" disabled={isPending} />
              )}
            </form.Field>

            <form.Field name="returnDate">
              {(field) => (
                <AppField
                  field={field}
                  label="Returns"
                  type="date"
                  disabled={isPending}
                  hint="Optional"
                />
              )}
            </form.Field>
          </div>

          <form.Field
            name="seatCapacity"
            validators={{ onChange: hajjBatchFieldsZodSchema.shape.seatCapacity }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Seat capacity"
                type="number"
                placeholder="45"
                disabled={isPending}
                hint={
                  isEdit && batch
                    ? `${batch.bookedSeats} seats are already booked.`
                    : "How many pilgrims this departure can take."
                }
              />
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
                  pendingLabel={isEdit ? "Saving..." : "Creating..."}
                  disabled={!canSubmit}
                  className="w-auto"
                >
                  {isEdit ? "Save changes" : "Create batch"}
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HajjBatchFormModal;
