"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createVisaCaseAction,
  updateVisaCaseAction,
} from "@/app/(dashboardLayout)/dashboard/visa/_action";
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
import { getCustomerDashboard } from "@/services/customer.services";
import { getVisaAgents } from "@/services/visa.services";
import {
  visaCaseFieldsZodSchema,
  type IVisaCaseFormValues,
} from "@/zod/visa.validation";
import { VISA_TYPE_PRESETS, type IVisaCase } from "@/types/visa.types";

interface VisaCaseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visaCase?: IVisaCase | null;
}

const NONE = "__none__";

const VisaCaseFormModal = ({ open, onOpenChange, visaCase }: VisaCaseFormModalProps) => {
  const isEdit = Boolean(visaCase);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: customersData } = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(),
    enabled: open,
  });

  const { data: agentsData } = useQuery({
    queryKey: ["visa-agents"],
    queryFn: () => getVisaAgents("limit=200"),
    enabled: open,
  });

  const customers = customersData?.data.data ?? [];
  const agents = agentsData?.data ?? [];

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IVisaCaseFormValues) =>
      isEdit && visaCase
        ? updateVisaCaseAction(visaCase.id, values)
        : createVisaCaseAction(values),
  });

  const defaultValues: IVisaCaseFormValues = visaCase
    ? {
        customerId: visaCase.customerId,
        visaAgentId: visaCase.visaAgentId ?? "",
        country: visaCase.country,
        visaType: visaCase.visaType,
        applicationNo: visaCase.applicationNo ?? "",
        submittedAt: formatDateForInput(visaCase.submittedAt),
        serviceFee: String(toNumber(visaCase.serviceFee)),
        embassyFee: String(toNumber(visaCase.embassyFee)),
      }
    : {
        customerId: "",
        visaAgentId: "",
        country: "",
        visaType: "",
        applicationNo: "",
        submittedAt: "",
        serviceFee: "",
        embassyFee: "",
      };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Case updated" : "Case created"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["visa-cases"] });
      // The fees bill the customer, so their due moves.
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-ledger"] });
      void queryClient.refetchQueries({ queryKey: ["visa-cases"], type: "active" });
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
          <DialogTitle>{isEdit ? "Edit visa case" : "New visa case"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "The applicant cannot be changed — a case does not change hands."
              : "Starts at Submitted, with a document checklist seeded from the visa type."}
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
              {isEdit ? (
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">{visaCase?.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {visaCase?.customer.phone} · applicant is fixed once the case exists
                  </p>
                </div>
              ) : (
                <form.Field name="customerId">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Applicant</Label>
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
              )}

              <form.Field
                name="country"
                validators={{ onChange: visaCaseFieldsZodSchema.shape.country }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Country"
                    placeholder="e.g. UAE, Malaysia"
                    disabled={isPending}
                  />
                )}
              </form.Field>

              <form.Field
                name="visaType"
                validators={{ onChange: visaCaseFieldsZodSchema.shape.visaType }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <AppField
                      field={field}
                      label="Visa type"
                      placeholder="e.g. Tourist"
                      disabled={isPending}
                      hint={
                        isEdit
                          ? "Changing this does not re-seed the checklist — papers are usually already being collected."
                          : "A known type seeds its document checklist automatically."
                      }
                    />
                    {!isEdit && (
                      <div className="flex flex-wrap gap-1">
                        {VISA_TYPE_PRESETS.map((preset) => (
                          <Button
                            key={preset}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => field.handleChange(preset)}
                            disabled={isPending}
                          >
                            {preset}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field name="visaAgentId">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Agent</Label>
                    <Select
                      value={field.state.value || NONE}
                      onValueChange={(next) => field.handleChange(next === NONE ? "" : next)}
                      disabled={isPending}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder="Pick an agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Radix forbids an empty-string item value. */}
                        <SelectItem value={NONE}>Handled in-house</SelectItem>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                            {agent.type ? ` — ${agent.type}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field
                name="applicationNo"
                validators={{ onChange: visaCaseFieldsZodSchema.shape.applicationNo }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Application number"
                    placeholder="From the embassy"
                    disabled={isPending}
                    hint="Optional"
                    className="font-mono"
                  />
                )}
              </form.Field>

              <div className="grid grid-cols-2 gap-3">
                <form.Field
                  name="serviceFee"
                  validators={{ onChange: visaCaseFieldsZodSchema.shape.serviceFee }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Service fee"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                      hint="Yours"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="embassyFee"
                  validators={{ onChange: visaCaseFieldsZodSchema.shape.embassyFee }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Embassy fee"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                      hint="Passed through"
                    />
                  )}
                </form.Field>
              </div>

              <form.Subscribe
                selector={(state) =>
                  [state.values.serviceFee, state.values.embassyFee] as const
                }
              >
                {([serviceFee, embassyFee]) => {
                  const total = toNumber(serviceFee) + toNumber(embassyFee);
                  if (total <= 0) return null;
                  return (
                    <p className="rounded-md border bg-muted/40 p-3 text-sm">
                      Billed to the applicant{" "}
                      <span className="font-medium">{formatCurrency(total)}</span>
                    </p>
                  );
                }}
              </form.Subscribe>

              <form.Field name="submittedAt">
                {(field) => (
                  <AppField
                    field={field}
                    label="Submitted on"
                    type="date"
                    disabled={isPending}
                    hint="Optional"
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
                      pendingLabel={isEdit ? "Saving..." : "Creating..."}
                      disabled={!canSubmit}
                      className="w-auto"
                    >
                      {isEdit ? "Save changes" : "Create case"}
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

export default VisaCaseFormModal;
