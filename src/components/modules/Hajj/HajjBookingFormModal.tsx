"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createHajjBookingAction } from "@/app/(dashboardLayout)/dashboard/hajj/_action";
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
import { getHajjBatches, getHajjPackages } from "@/services/hajj.services";
import {
  hajjBookingFieldsZodSchema,
  type IHajjBookingFormValues,
} from "@/zod/hajj.validation";
import { HAJJ_PACKAGE_TYPE_LABELS } from "@/types/enums.types";

interface HajjBookingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Create only — a booking's package, batch and price are its identity, and the
 * price is snapshotted so it cannot drift with the package.
 *
 * Batches are filtered to the chosen package, and a full batch is disabled in
 * the list rather than left selectable for the API to refuse.
 */
const HajjBookingFormModal = ({ open, onOpenChange }: HajjBookingFormModalProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: customersData } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
    enabled: open,
  });

  const { data: packagesData } = useQuery({
    queryKey: ["hajj-packages"],
    queryFn: () => getHajjPackages("limit=200"),
    enabled: open,
  });

  const { data: batchesData } = useQuery({
    queryKey: ["hajj-batches"],
    queryFn: () => getHajjBatches("limit=200"),
    enabled: open,
  });

  const customers = customersData?.data.data ?? [];
  const packages = (packagesData?.data ?? []).filter((item) => item.isActive);
  const batches = batchesData?.data ?? [];

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IHajjBookingFormValues) => createHajjBookingAction(values),
  });

  const defaultValues: IHajjBookingFormValues = {
    customerId: "",
    packageId: "",
    batchId: "",
    pilgrimName: "",
    passportNumber: "",
    munajjimNumber: "",
    packagePrice: "",
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
      void queryClient.invalidateQueries({ queryKey: ["hajj-bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["hajj-batches"] });
      void queryClient.invalidateQueries({ queryKey: ["hajj-batch-summary"] });
      // The package price bills the customer, so their due moves.
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      void queryClient.refetchQueries({ queryKey: ["hajj-bookings"], type: "active" });
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
            One row per pilgrim. The price is snapshotted now, so a later package price change
            will not move this booking.
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

              <form.Field
                name="pilgrimName"
                validators={{ onChange: hajjBookingFieldsZodSchema.shape.pilgrimName }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Pilgrim name"
                    placeholder="As on the passport"
                    disabled={isPending}
                    hint="Often not the same person as the customer paying."
                  />
                )}
              </form.Field>

              <form.Field name="packageId">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Package</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(next) => {
                        field.handleChange(next);
                        // The chosen batch may belong to another package, and
                        // the price default follows the package.
                        form.setFieldValue("batchId", "");
                        const chosen = packages.find((item) => item.id === next);
                        if (chosen) {
                          form.setFieldValue("packagePrice", String(toNumber(chosen.price)));
                        }
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder="Pick a package" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} — {HAJJ_PACKAGE_TYPE_LABELS[item.type]} ·{" "}
                            {formatCurrency(item.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(state) => state.values.packageId}>
                {(packageId) => (
                  <form.Field name="batchId">
                    {(field) => {
                      const available = batches.filter(
                        (batch) => batch.packageId === packageId,
                      );

                      return (
                        <div className="space-y-1.5">
                          <Label htmlFor={field.name}>Batch</Label>
                          <Select
                            value={field.state.value}
                            onValueChange={field.handleChange}
                            disabled={isPending || !packageId}
                          >
                            <SelectTrigger id={field.name} className="w-full">
                              <SelectValue
                                placeholder={
                                  packageId ? "Pick a batch" : "Pick a package first"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {available.map((batch) => (
                                <SelectItem
                                  key={batch.id}
                                  value={batch.id}
                                  // A full batch would be refused by the API, so
                                  // it is disabled rather than silently failing.
                                  disabled={batch.availableSeats === 0}
                                >
                                  {batch.name} · {formatDate(batch.departureDate)} ·{" "}
                                  {batch.availableSeats === 0
                                    ? "full"
                                    : `${formatNumber(batch.availableSeats)} free`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {packageId && available.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              No batches for this package yet.
                            </p>
                          )}
                        </div>
                      );
                    }}
                  </form.Field>
                )}
              </form.Subscribe>

              <form.Field
                name="packagePrice"
                validators={{ onChange: hajjBookingFieldsZodSchema.shape.packagePrice }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Price for this pilgrim"
                    placeholder="0.00"
                    disabled={isPending}
                    prepend={<span className="text-sm">৳</span>}
                    hint="Defaults to the package price. Change it here for a negotiated rate."
                  />
                )}
              </form.Field>

              <form.Field
                name="passportNumber"
                validators={{ onChange: hajjBookingFieldsZodSchema.shape.passportNumber }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Passport number"
                    disabled={isPending}
                    hint="Optional"
                    className="font-mono uppercase"
                  />
                )}
              </form.Field>

              <form.Field
                name="munajjimNumber"
                validators={{ onChange: hajjBookingFieldsZodSchema.shape.munajjimNumber }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Munajjim number"
                    disabled={isPending}
                    hint="Optional"
                    className="font-mono"
                  />
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

export default HajjBookingFormModal;
