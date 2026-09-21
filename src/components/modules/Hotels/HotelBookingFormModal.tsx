"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createHotelBookingAction,
  updateHotelBookingAction,
} from "@/app/(dashboardLayout)/dashboard/hotels/_action";
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
import { formatDateForInput } from "@/lib/format";
import { customerOptions } from "@/lib/pickerOptions";
import { getCustomerDashboard } from "@/services/customer.services";
import {
  hotelBookingFieldsZodSchema,
  type IHotelBookingFormValues,
} from "@/zod/hotel.validation";
import { type IHotelBooking } from "@/types/hotel.types";

interface HotelBookingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: IHotelBooking | null;
}

/**
 * A stay at a named property. There is no hotel master list — the name on the
 * voucher is what matters, and a second list to maintain would not earn its
 * keep.
 *
 * On an edit the customer is fixed: a booking cannot change hands.
 */
const HotelBookingFormModal = ({ open, onOpenChange, booking }: HotelBookingFormModalProps) => {
  const isEdit = Boolean(booking);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: customersData } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
    enabled: open && !isEdit,
  });

  const customers = customersData?.data.data ?? [];

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IHotelBookingFormValues) =>
      isEdit && booking
        ? updateHotelBookingAction(booking.id, values)
        : createHotelBookingAction(values),
  });

  const defaultValues: IHotelBookingFormValues = booking
    ? {
        customerId: booking.customerId,
        hotelName: booking.hotelName,
        city: booking.city,
        country: booking.country ?? "",
        bookedThrough: booking.bookedThrough ?? "",
        confirmationNo: booking.confirmationNo ?? "",
        guestName: booking.guestName,
        checkIn: formatDateForInput(booking.checkIn),
        checkOut: formatDateForInput(booking.checkOut),
        rooms: String(booking.rooms),
        guests: String(booking.guests),
        roomType: booking.roomType ?? "",
        sellAmount: String(booking.sellAmount),
        costAmount: String(booking.costAmount),
        note: booking.note ?? "",
      }
    : {
        customerId: "",
        hotelName: "",
        city: "",
        country: "",
        bookedThrough: "",
        confirmationNo: "",
        guestName: "",
        checkIn: "",
        checkOut: "",
        rooms: "1",
        guests: "1",
        roomType: "",
        sellAmount: "",
        costAmount: "",
        note: "",
      };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Booking updated" : "Booking created"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["hotel-bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["hotel-summary"] });
      if (booking) {
        void queryClient.invalidateQueries({ queryKey: ["hotel-booking", booking.id] });
      }
      // The stay bills the customer, so their due moves.
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      void queryClient.refetchQueries({ queryKey: ["hotel-bookings"], type: "active" });
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
          <DialogTitle>{isEdit ? "Edit booking" : "New hotel booking"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Moving the dates recounts the nights. The customer cannot change — a booking cannot change hands."
              : "Nights are counted from the dates, so there is nothing to keep in step by hand."}
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
              {!isEdit && (
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
              )}

              <form.Field
                name="guestName"
                validators={{ onChange: hotelBookingFieldsZodSchema.shape.guestName }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Guest"
                    placeholder="Who is staying"
                    disabled={isPending}
                    hint="Often not the same person as the customer paying."
                  />
                )}
              </form.Field>

              <form.Field
                name="hotelName"
                validators={{ onChange: hotelBookingFieldsZodSchema.shape.hotelName }}
              >
                {(field) => (
                  <AppField field={field} label="Hotel" placeholder="Sea Palace" disabled={isPending} />
                )}
              </form.Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="city"
                  validators={{ onChange: hotelBookingFieldsZodSchema.shape.city }}
                >
                  {(field) => (
                    <AppField field={field} label="City" placeholder="Cox's Bazar" disabled={isPending} />
                  )}
                </form.Field>

                <form.Field
                  name="country"
                  validators={{ onChange: hotelBookingFieldsZodSchema.shape.country }}
                >
                  {(field) => (
                    <AppField field={field} label="Country" disabled={isPending} hint="Optional" />
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="checkIn"
                  validators={{ onChange: hotelBookingFieldsZodSchema.shape.checkIn }}
                >
                  {(field) => (
                    <AppField field={field} label="Check-in" type="date" disabled={isPending} />
                  )}
                </form.Field>

                <form.Field
                  name="checkOut"
                  validators={{ onChange: hotelBookingFieldsZodSchema.shape.checkOut }}
                >
                  {(field) => (
                    <AppField field={field} label="Check-out" type="date" disabled={isPending} />
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="rooms"
                  validators={{ onChange: hotelBookingFieldsZodSchema.shape.rooms }}
                >
                  {(field) => <AppField field={field} label="Rooms" disabled={isPending} />}
                </form.Field>

                <form.Field
                  name="guests"
                  validators={{ onChange: hotelBookingFieldsZodSchema.shape.guests }}
                >
                  {(field) => <AppField field={field} label="Guests" disabled={isPending} />}
                </form.Field>
              </div>

              <form.Field
                name="roomType"
                validators={{ onChange: hotelBookingFieldsZodSchema.shape.roomType }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Room type"
                    placeholder="Deluxe twin"
                    disabled={isPending}
                    hint="Optional"
                  />
                )}
              </form.Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="sellAmount"
                  validators={{ onChange: hotelBookingFieldsZodSchema.shape.sellAmount }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Price"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                      hint="The whole stay."
                    />
                  )}
                </form.Field>

                <form.Field
                  name="costAmount"
                  validators={{ onChange: hotelBookingFieldsZodSchema.shape.costAmount }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Cost"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                      hint="What the rooms cost the agency."
                    />
                  )}
                </form.Field>
              </div>

              <form.Field
                name="bookedThrough"
                validators={{ onChange: hotelBookingFieldsZodSchema.shape.bookedThrough }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Booked through"
                    placeholder="Who gave you the rate"
                    disabled={isPending}
                    hint="Optional"
                  />
                )}
              </form.Field>

              <form.Field
                name="confirmationNo"
                validators={{ onChange: hotelBookingFieldsZodSchema.shape.confirmationNo }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Confirmation no."
                    disabled={isPending}
                    hint="Optional"
                  />
                )}
              </form.Field>

              <form.Field
                name="note"
                validators={{ onChange: hotelBookingFieldsZodSchema.shape.note }}
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
                      pendingLabel={isEdit ? "Saving..." : "Creating..."}
                      disabled={!canSubmit}
                      className="w-auto"
                    >
                      {isEdit ? "Save changes" : "Create booking"}
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

export default HotelBookingFormModal;
