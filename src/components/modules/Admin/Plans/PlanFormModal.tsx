"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createPlanAction,
  updatePlanAction,
} from "@/app/(dashboardLayout)/admin/dashboard/_action";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toNumber } from "@/lib/format";
import { planFieldsZodSchema, type IPlanFormValues } from "@/zod/admin.validation";
import { type IAdminPlan } from "@/types/admin.types";
import { PLAN_FEATURE_OPTIONS } from "@/types/enums.types";

interface PlanFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: IAdminPlan | null;
}

const PlanFormModal = ({ open, onOpenChange, plan }: PlanFormModalProps) => {
  const isEdit = Boolean(plan);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IPlanFormValues) =>
      isEdit && plan ? updatePlanAction(plan.id, values) : createPlanAction(values),
  });

  const defaultValues: IPlanFormValues = plan
    ? {
        name: plan.name,
        description: plan.description ?? "",
        price: String(toNumber(plan.price)),
        durationDays: String(plan.durationDays),
        isActive: plan.isActive,
        features: [...plan.features],
      }
    : { name: "", description: "", price: "", durationDays: "30", isActive: true, features: [] };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Plan updated" : "Plan created"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      void queryClient.invalidateQueries({ queryKey: ["billing-plans"] });
      void queryClient.invalidateQueries({ queryKey: ["activity-log"] });
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
          <DialogTitle>{isEdit ? "Edit plan" : "New plan"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Changing the price does not re-bill anyone — existing subscriptions keep their end date."
              : "What an agency can buy, and which modules it unlocks."}
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
          <form.Field name="name" validators={{ onChange: planFieldsZodSchema.shape.name }}>
            {(field) => (
              <AppField field={field} label="Name" placeholder="e.g. Growth" disabled={isPending} />
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field name="price" validators={{ onChange: planFieldsZodSchema.shape.price }}>
              {(field) => (
                <AppField
                  field={field}
                  label="Price"
                  placeholder="0.00"
                  disabled={isPending}
                  prepend={<span className="text-sm">৳</span>}
                  hint="Zero is a free tier"
                />
              )}
            </form.Field>

            <form.Field
              name="durationDays"
              validators={{ onChange: planFieldsZodSchema.shape.durationDays }}
            >
              {(field) => (
                <AppField
                  field={field}
                  label="Duration"
                  type="number"
                  disabled={isPending}
                  hint="Days"
                />
              )}
            </form.Field>
          </div>

          <form.Field name="features">
            {(field) => (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Modules unlocked</legend>
                <div className="grid grid-cols-2 gap-2">
                  {PLAN_FEATURE_OPTIONS.map((option) => {
                    const checked = field.state.value.includes(option.value);
                    return (
                      <div key={option.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`feature-${option.value}`}
                          checked={checked}
                          disabled={isPending}
                          onCheckedChange={(next) =>
                            field.handleChange(
                              next
                                ? [...field.state.value, option.value]
                                : field.state.value.filter((item) => item !== option.value),
                            )
                          }
                        />
                        <Label
                          htmlFor={`feature-${option.value}`}
                          className="text-sm font-normal"
                        >
                          {option.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                {/* CRM gates nothing today — customers and collections are base
                    features — so a plan selling it unlocks nothing extra. Said
                    here so an operator does not price something empty. */}
                <p className="text-xs text-muted-foreground">
                  CRM currently gates no module; customers and collections are included on every
                  plan.
                </p>
              </fieldset>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Description</Label>
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

          <form.Field name="isActive">
            {(field) => (
              <div className="flex items-start gap-2">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                  disabled={isPending}
                />
                <div className="space-y-0.5">
                  <Label htmlFor={field.name} className="font-normal">
                    On offer
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    An inactive plan stays on the agencies already using it but cannot be bought.
                  </p>
                </div>
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
                  pendingLabel={isEdit ? "Saving..." : "Creating..."}
                  disabled={!canSubmit}
                  className="w-auto"
                >
                  {isEdit ? "Save changes" : "Create plan"}
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlanFormModal;
