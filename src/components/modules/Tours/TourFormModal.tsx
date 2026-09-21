"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTourAction, updateTourAction } from "@/app/(dashboardLayout)/dashboard/tours/_action";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateForInput, toNumber } from "@/lib/format";
import { tourFieldsZodSchema, type ITourFormValues } from "@/zod/tour.validation";
import { TOUR_STATUS_OPTIONS, type TourStatus } from "@/types/enums.types";
import { type ITourPackage } from "@/types/tour.types";

interface TourFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tour?: ITourPackage | null;
}

/**
 * One dated trip. Repricing it never moves an existing booking — each one
 * snapshotted its own price when it was made.
 */
const TourFormModal = ({ open, onOpenChange, tour }: TourFormModalProps) => {
  const isEdit = Boolean(tour);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ITourFormValues) =>
      isEdit && tour ? updateTourAction(tour.id, values) : createTourAction(values),
  });

  const defaultValues: ITourFormValues = tour
    ? {
        name: tour.name,
        destination: tour.destination,
        departureDate: formatDateForInput(tour.departureDate),
        returnDate: formatDateForInput(tour.returnDate),
        durationDays: tour.durationDays ? String(tour.durationDays) : "",
        // Blank is how "no seat limit" is expressed, so null must not become "0".
        seatCapacity: tour.seatCapacity === null ? "" : String(tour.seatCapacity),
        pricePerPerson: String(toNumber(tour.pricePerPerson)),
        costPerPerson: String(toNumber(tour.costPerPerson)),
        inclusions: tour.inclusions ?? "",
        description: tour.description ?? "",
        status: tour.status,
      }
    : {
        name: "",
        destination: "",
        departureDate: "",
        returnDate: "",
        durationDays: "",
        seatCapacity: "",
        pricePerPerson: "",
        costPerPerson: "",
        inclusions: "",
        description: "",
        status: "OPEN",
      };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        // "N seats are already sold on this tour" comes from the API, which
        // counts them against committed rows.
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Tour updated" : "Tour created"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["tours"] });
      void queryClient.invalidateQueries({ queryKey: ["tour-summary"] });
      void queryClient.refetchQueries({ queryKey: ["tours"], type: "active" });
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
          <DialogTitle>{isEdit ? "Edit tour" : "New tour"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Repricing changes what new bookings cost. Existing ones keep the price they were sold at."
              : "A dated trip with its own seats and price."}
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
                validators={{ onChange: tourFieldsZodSchema.shape.name }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Tour name"
                    placeholder="Cox's Bazar 3 nights"
                    disabled={isPending}
                  />
                )}
              </form.Field>

              <form.Field
                name="destination"
                validators={{ onChange: tourFieldsZodSchema.shape.destination }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Destination"
                    placeholder="Cox's Bazar"
                    disabled={isPending}
                  />
                )}
              </form.Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field name="departureDate">
                  {(field) => (
                    <AppField
                      field={field}
                      label="Departure"
                      type="date"
                      disabled={isPending}
                      hint="Optional"
                    />
                  )}
                </form.Field>

                <form.Field name="returnDate">
                  {(field) => (
                    <AppField
                      field={field}
                      label="Return"
                      type="date"
                      disabled={isPending}
                      hint="Optional"
                    />
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="durationDays"
                  validators={{ onChange: tourFieldsZodSchema.shape.durationDays }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Days"
                      placeholder="3"
                      disabled={isPending}
                      hint="Optional"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="seatCapacity"
                  validators={{ onChange: tourFieldsZodSchema.shape.seatCapacity }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Seats"
                      placeholder="No limit"
                      disabled={isPending}
                      hint="Leave blank for no fixed limit."
                    />
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="pricePerPerson"
                  validators={{ onChange: tourFieldsZodSchema.shape.pricePerPerson }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Price per person"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="costPerPerson"
                  validators={{ onChange: tourFieldsZodSchema.shape.costPerPerson }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Cost per person"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                      hint="What it costs the agency."
                    />
                  )}
                </form.Field>
              </div>

              {isEdit && (
                <form.Field name="status">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Status</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(next) => field.handleChange(next as TourStatus)}
                        disabled={isPending}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TOUR_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Only an open tour takes new bookings.
                      </p>
                    </div>
                  )}
                </form.Field>
              )}

              <form.Field
                name="inclusions"
                validators={{ onChange: tourFieldsZodSchema.shape.inclusions }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>What is included</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="Hotel, meals, transport…"
                      disabled={isPending}
                      rows={3}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field
                name="description"
                validators={{ onChange: tourFieldsZodSchema.shape.description }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Description</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      disabled={isPending}
                      rows={3}
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
                      pendingLabel={isEdit ? "Saving..." : "Creating..."}
                      disabled={!canSubmit}
                      className="w-auto"
                    >
                      {isEdit ? "Save changes" : "Create tour"}
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

export default TourFormModal;
