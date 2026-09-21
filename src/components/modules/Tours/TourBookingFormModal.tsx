"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTourBookingAction } from "@/app/(dashboardLayout)/dashboard/tours/_action";
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
import { formatCurrency, formatDate, formatNumber, toNumber } from "@/lib/format";
import { customerOptions } from "@/lib/pickerOptions";
import { getCustomerDashboard } from "@/services/customer.services";
import { getTours } from "@/services/tour.services";
import { tourBookingFieldsZodSchema, type ITourBookingFormValues } from "@/zod/tour.validation";
import { type ITourPackage } from "@/types/tour.types";

interface TourBookingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The seats a tour has left, or null when it has no limit. */
const seatsLeftOf = (tour: ITourPackage) => tour.seatsLeft;

/**
 * Create only — the customer and the tour are a booking's identity, and its
 * price is snapshotted so repricing the tour cannot move it.
 *
 * Price and cost default to the tour rate times the seats and stay editable,
 * because tours are where a customer haggles.
 */
const TourBookingFormModal = ({ open, onOpenChange }: TourBookingFormModalProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: customersData } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
    enabled: open,
  });

  const { data: toursData } = useQuery({
    queryKey: ["tours"],
    queryFn: () => getTours("limit=200"),
    enabled: open,
  });

  const customers = customersData?.data.data ?? [];
  const tours = (toursData?.data ?? []).filter((tour) => tour.status === "OPEN");

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ITourBookingFormValues) => createTourBookingAction(values),
  });

  const defaultValues: ITourBookingFormValues = {
    customerId: "",
    packageId: "",
    leadTraveller: "",
    travellers: "1",
    sellAmount: "",
    costAmount: "",
    note: "",
  };

  /** Refills price and cost from the tour rate times the seats. */
  const applyTourRate = (tour: ITourPackage | undefined, travellers: string) => {
    if (!tour) return;
    const seats = Number(travellers) || 1;
    form.setFieldValue("sellAmount", String(toNumber(tour.pricePerPerson) * seats));
    form.setFieldValue("costAmount", String(toNumber(tour.costPerPerson) * seats));
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Failed to create booking");
        return;
      }

      toast.success(result.message || "Booking created");
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["tour-bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["tours"] });
      void queryClient.invalidateQueries({ queryKey: ["tour-summary"] });
      // The sale bills the customer, so their due moves.
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      void queryClient.refetchQueries({ queryKey: ["tour-bookings"], type: "active" });
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
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>
            The price is snapshotted now, so repricing the tour later will not move this
            booking.
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
                      options={customerOptions(customers)}
                      placeholder="Who is paying"
                      searchPlaceholder="Search by name, phone or passport…"
                      emptyText="No customer matches. Add them on the Customers page first."
                      loading={!customersData}
                      disabled={isPending}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="packageId">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Tour</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(next) => {
                        field.handleChange(next);
                        applyTourRate(
                          tours.find((tour) => tour.id === next),
                          form.getFieldValue("travellers") ?? "1",
                        );
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder="Pick a tour" />
                      </SelectTrigger>
                      <SelectContent>
                        {tours.map((tour) => {
                          const left = seatsLeftOf(tour);
                          return (
                            <SelectItem
                              key={tour.id}
                              value={tour.id}
                              // A full tour would be refused by the API, so it
                              // is disabled rather than silently failing.
                              disabled={left !== null && left <= 0}
                            >
                              {tour.name} · {formatDate(tour.departureDate)} ·{" "}
                              {formatCurrency(tour.pricePerPerson)}
                              {left === null ? "" : ` · ${formatNumber(left)} free`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field
                name="leadTraveller"
                validators={{ onChange: tourBookingFieldsZodSchema.shape.leadTraveller }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Lead traveller"
                    placeholder="Who the booking is under"
                    disabled={isPending}
                    hint="Often not the same person as the customer paying."
                  />
                )}
              </form.Field>

              <form.Field
                name="travellers"
                validators={{ onChange: tourBookingFieldsZodSchema.shape.travellers }}
                // Seats drive the default price, so it follows them until
                // someone types over it.
                listeners={{
                  onChange: ({ value }) =>
                    applyTourRate(
                      tours.find((tour) => tour.id === form.getFieldValue("packageId")),
                      value ?? "1",
                    ),
                }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Travellers"
                    placeholder="1"
                    disabled={isPending}
                    hint="Seats this booking takes."
                  />
                )}
              </form.Field>

              <form.Field
                name="sellAmount"
                validators={{ onChange: tourBookingFieldsZodSchema.shape.sellAmount }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Price"
                    placeholder="0.00"
                    disabled={isPending}
                    prepend={<span className="text-sm">৳</span>}
                    hint="The whole booking. Defaults to the tour rate times the seats."
                  />
                )}
              </form.Field>

              <form.Field
                name="costAmount"
                validators={{ onChange: tourBookingFieldsZodSchema.shape.costAmount }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Cost"
                    placeholder="0.00"
                    disabled={isPending}
                    prepend={<span className="text-sm">৳</span>}
                    hint="What the trip costs the agency. This is what makes the profit real."
                  />
                )}
              </form.Field>

              <form.Field
                name="note"
                validators={{ onChange: tourBookingFieldsZodSchema.shape.note }}
              >
                {(field) => (
                  <AppField field={field} label="Note" disabled={isPending} hint="Optional" />
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
                      pendingLabel="Creating..."
                      disabled={!canSubmit}
                      className="w-auto"
                    >
                      Create booking
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

export default TourBookingFormModal;
