"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createTicketAction,
  updateTicketAction,
} from "@/app/(dashboardLayout)/dashboard/tickets/_action";
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
import { formatCurrency, formatDateForInput, toNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getCustomerDashboard } from "@/services/customer.services";
import { getAirlines, getRoutes } from "@/services/masterData.services";
import { getSupplierDashboard } from "@/services/supplier.services";
import {
  createTicketFormZodSchema,
  type ICreateTicketFormValues,
} from "@/zod/ticket.validation";
import { type ITicket } from "@/types/ticket.types";

interface TicketFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: ITicket | null;
}

const emptyValues: ICreateTicketFormValues = {
  customerId: "",
  supplierId: "",
  airlineId: "",
  routeId: "",
  passengerName: "",
  pnr: "",
  travelDate: "",
  issueDate: "",
  fare: "",
  cost: "",
};

const NONE = "__none__";

const TicketFormModal = ({ open, onOpenChange, ticket }: TicketFormModalProps) => {
  const isEdit = Boolean(ticket);
  const queryClient = useQueryClient();
  const router = useRouter();

  // All four lists share caches with their own pages, so opening this modal
  // usually costs nothing.
  const { data: customersData } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
    enabled: open,
  });
  const { data: suppliersData } = useQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: () => getSupplierDashboard(),
    enabled: open,
  });
  const { data: airlinesData } = useQuery({
    queryKey: ["airlines", "limit=200"],
    queryFn: () => getAirlines("limit=200"),
    enabled: open,
  });
  const { data: routesData } = useQuery({
    queryKey: ["routes", "limit=200"],
    queryFn: () => getRoutes("limit=200"),
    enabled: open,
  });

  const customers = customersData?.data.data ?? [];
  const suppliers = suppliersData?.data.data ?? [];
  const airlines = airlinesData?.data ?? [];
  const routes = routesData?.data ?? [];

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ICreateTicketFormValues) =>
      isEdit && ticket ? updateTicketAction(ticket.id, values) : createTicketAction(values),
  });

  const form = useForm({
    defaultValues: ticket
      ? {
          customerId: ticket.customerId,
          supplierId: ticket.supplierId ?? "",
          airlineId: ticket.airlineId ?? "",
          routeId: ticket.routeId ?? "",
          passengerName: ticket.passengerName,
          pnr: ticket.pnr,
          travelDate: formatDateForInput(ticket.travelDate),
          issueDate: formatDateForInput(ticket.issueDate),
          fare: String(toNumber(ticket.fare)),
          cost: String(toNumber(ticket.cost)),
        }
      : emptyValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Ticket updated" : "Ticket issued"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      // Issuing a ticket bills the customer and accrues the supplier payable.
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      void queryClient.invalidateQueries({ queryKey: ["supplier-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["supplier-ledger"] });
      void queryClient.refetchQueries({ queryKey: ["tickets"], type: "active" });
      router.refresh();
    },
  });

  /** An optional relation select: "None" has to be a sentinel, not "". */
  const relationSelect = (
    fieldName: "supplierId" | "airlineId" | "routeId",
    label: string,
    options: { id: string; label: string }[],
    placeholder: string,
  ) => (
    <form.Field name={fieldName}>
      {(field) => (
        <div className="space-y-1.5">
          <Label htmlFor={field.name}>{label}</Label>
          <Select
            value={field.state.value || NONE}
            onValueChange={(next) => field.handleChange(next === NONE ? "" : next)}
            disabled={isPending}
          >
            <SelectTrigger id={field.name} className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {/* Radix forbids an empty-string item value. */}
              <SelectItem value={NONE}>Not set</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </form.Field>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) form.reset();
      }}
    >
      <DialogContent
        className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>{isEdit ? "Edit ticket" : "Issue ticket"}</DialogTitle>
          <DialogDescription>
            The fare bills the customer and the cost accrues against the supplier, so both sides
            move the moment this is saved.
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
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={isPending}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder="Pick a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} — {customer.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field
                name="passengerName"
                validators={{ onChange: createTicketFormZodSchema.shape.passengerName }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Passenger name"
                    placeholder="As printed on the ticket"
                    disabled={isPending}
                    hint="Can differ from the customer — one person often books for another."
                  />
                )}
              </form.Field>

              <form.Field
                name="pnr"
                validators={{ onChange: createTicketFormZodSchema.shape.pnr }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="PNR"
                    placeholder="ABC123"
                    disabled={isPending}
                    className="font-mono uppercase"
                  />
                )}
              </form.Field>

              {relationSelect(
                "airlineId",
                "Airline",
                airlines.map((a) => ({ id: a.id, label: `${a.shortCode} — ${a.name}` })),
                "Pick an airline",
              )}

              {relationSelect(
                "routeId",
                "Route",
                routes.map((r) => ({ id: r.id, label: r.name })),
                "Pick a sector",
              )}

              {relationSelect(
                "supplierId",
                "Supplier",
                suppliers.map((s) => ({ id: s.id, label: s.name })),
                "Pick a supplier",
              )}

              <div className="grid grid-cols-2 gap-3">
                <form.Field
                  name="fare"
                  validators={{ onChange: createTicketFormZodSchema.shape.fare }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Fare"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                      hint="What you charge"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="cost"
                  validators={{ onChange: createTicketFormZodSchema.shape.cost }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Cost"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                      hint="What you pay"
                    />
                  )}
                </form.Field>
              </div>

              {/* Live margin. Worth showing before saving, because selling below
                  cost is allowed and the old system did it silently. */}
              <form.Subscribe
                selector={(state) => [state.values.fare, state.values.cost] as const}
              >
                {([fare, cost]) => {
                  if (fare === "" && cost === "") return null;
                  const profit = toNumber(fare) - toNumber(cost);
                  return (
                    <div className="rounded-md border bg-muted/40 p-3 text-sm">
                      Profit on this ticket{" "}
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          profit > 0 && "text-success",
                          profit < 0 && "text-destructive",
                        )}
                      >
                        {formatCurrency(profit)}
                      </span>
                      {profit < 0 && (
                        <p className="mt-1 text-xs text-destructive">
                          This sells below cost. Allowed, but check it is intended.
                        </p>
                      )}
                    </div>
                  );
                }}
              </form.Subscribe>

              <div className="grid grid-cols-2 gap-3">
                <form.Field name="travelDate">
                  {(field) => (
                    <AppField field={field} label="Travel date" type="date" disabled={isPending} />
                  )}
                </form.Field>

                <form.Field name="issueDate">
                  {(field) => (
                    <AppField
                      field={field}
                      label="Issue date"
                      type="date"
                      disabled={isPending}
                      hint="Defaults to today."
                    />
                  )}
                </form.Field>
              </div>

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
                      pendingLabel={isEdit ? "Saving..." : "Issuing..."}
                      disabled={!canSubmit}
                      className="w-auto"
                    >
                      {isEdit ? "Save changes" : "Issue ticket"}
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

export default TicketFormModal;
