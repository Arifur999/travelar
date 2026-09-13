"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createHajjPackageAction,
  updateHajjPackageAction,
} from "@/app/(dashboardLayout)/dashboard/hajj/_action";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toNumber } from "@/lib/format";
import {
  hajjPackageFieldsZodSchema,
  type IHajjPackageFormValues,
} from "@/zod/hajj.validation";
import {
  HAJJ_MEAL_PLAN_OPTIONS,
  HAJJ_PACKAGE_TYPE_OPTIONS,
  HAJJ_TIER_OPTIONS,
  type HajjMealPlan,
  type HajjPackageType,
  type HajjTier,
} from "@/types/enums.types";
import { type IHajjPackage } from "@/types/hajj.types";

interface HajjPackageFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hajjPackage?: IHajjPackage | null;
}

const HajjPackageFormModal = ({
  open,
  onOpenChange,
  hajjPackage,
}: HajjPackageFormModalProps) => {
  const isEdit = Boolean(hajjPackage);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IHajjPackageFormValues) =>
      isEdit && hajjPackage
        ? updateHajjPackageAction(hajjPackage.id, values)
        : createHajjPackageAction(values),
  });

  const defaultValues: IHajjPackageFormValues = hajjPackage
    ? {
        name: hajjPackage.name,
        type: hajjPackage.type,
        tier: hajjPackage.tier ?? "ECONOMY",
        price: String(toNumber(hajjPackage.price)),
        durationDays: hajjPackage.durationDays ? String(hajjPackage.durationDays) : "",
        makkahHotel: hajjPackage.makkahHotel ?? "",
        makkahDistance: hajjPackage.makkahDistance ?? "",
        madinahHotel: hajjPackage.madinahHotel ?? "",
        madinahDistance: hajjPackage.madinahDistance ?? "",
        muallim: hajjPackage.muallim ?? "",
        mealPlan: hajjPackage.mealPlan ?? "NONE",
        description: hajjPackage.description ?? "",
        isActive: hajjPackage.isActive,
      }
    : {
        name: "",
        type: "UMRAH",
        tier: "ECONOMY",
        price: "",
        durationDays: "",
        makkahHotel: "",
        makkahDistance: "",
        madinahHotel: "",
        madinahDistance: "",
        muallim: "",
        mealPlan: "NONE",
        description: "",
        isActive: true,
      };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Package updated" : "Package created"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["hajj-packages"] });
      void queryClient.refetchQueries({ queryKey: ["hajj-packages"], type: "active" });
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
        className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>{isEdit ? "Edit package" : "New package"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Changing the price does not move any existing booking — each one snapshotted its own price."
              : "What you sell. Batches are the departures that run it."}
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
                validators={{ onChange: hajjPackageFieldsZodSchema.shape.name }}
              >
                {(field) => (
                  <AppField
                    field={field}
                    label="Package name"
                    placeholder="e.g. Umrah Premium 14 Days"
                    disabled={isPending}
                  />
                )}
              </form.Field>

              <div className="grid grid-cols-2 gap-3">
                <form.Field name="type">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Type</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(next) => field.handleChange(next as HajjPackageType)}
                        disabled={isPending}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HAJJ_PACKAGE_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Hajj bookings get two extra documents on their checklist.
                      </p>
                    </div>
                  )}
                </form.Field>

                <form.Field name="tier">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Tier</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(next) => field.handleChange(next as HajjTier)}
                        disabled={isPending}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HAJJ_TIER_OPTIONS.map((option) => (
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

              <div className="grid grid-cols-2 gap-3">
                <form.Field
                  name="price"
                  validators={{ onChange: hajjPackageFieldsZodSchema.shape.price }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Price"
                      placeholder="0.00"
                      disabled={isPending}
                      prepend={<span className="text-sm">৳</span>}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="durationDays"
                  validators={{ onChange: hajjPackageFieldsZodSchema.shape.durationDays }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Duration"
                      type="number"
                      placeholder="14"
                      disabled={isPending}
                      hint="Days, optional"
                    />
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <form.Field
                  name="makkahHotel"
                  validators={{ onChange: hajjPackageFieldsZodSchema.shape.makkahHotel }}
                >
                  {(field) => (
                    <AppField field={field} label="Makkah hotel" disabled={isPending} />
                  )}
                </form.Field>

                <form.Field
                  name="makkahDistance"
                  validators={{ onChange: hajjPackageFieldsZodSchema.shape.makkahDistance }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Distance"
                      placeholder="e.g. 300m from Haram"
                      disabled={isPending}
                    />
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <form.Field
                  name="madinahHotel"
                  validators={{ onChange: hajjPackageFieldsZodSchema.shape.madinahHotel }}
                >
                  {(field) => (
                    <AppField field={field} label="Madinah hotel" disabled={isPending} />
                  )}
                </form.Field>

                <form.Field
                  name="madinahDistance"
                  validators={{ onChange: hajjPackageFieldsZodSchema.shape.madinahDistance }}
                >
                  {(field) => (
                    <AppField field={field} label="Distance" disabled={isPending} />
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <form.Field
                  name="muallim"
                  validators={{ onChange: hajjPackageFieldsZodSchema.shape.muallim }}
                >
                  {(field) => (
                    <AppField field={field} label="Muallim" disabled={isPending} />
                  )}
                </form.Field>

                <form.Field name="mealPlan">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Meals</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(next) => field.handleChange(next as HajjMealPlan)}
                        disabled={isPending}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HAJJ_MEAL_PLAN_OPTIONS.map((option) => (
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

              <form.Field name="description">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Description</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      rows={3}
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
                        Active
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        A retired package keeps its bookings but is not offered for new ones.
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
                      {isEdit ? "Save changes" : "Create package"}
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

export default HajjPackageFormModal;
