"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createAirlineAction,
  updateAirlineAction,
} from "@/app/(dashboardLayout)/dashboard/airlines/_action";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createAirlineFormZodSchema,
  type ICreateAirlineFormValues,
} from "@/zod/masterData.validation";
import { type IAirline } from "@/types/masterData.types";

interface AirlineFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present means edit; absent means create. */
  airline?: IAirline | null;
}

const emptyValues: ICreateAirlineFormValues = {
  name: "",
  shortCode: "",
  logoUrl: "",
  remark: "",
};

/**
 * One modal for create and edit.
 *
 * The implementation this replaces had a separate Create*Modal and Edit*Modal
 * per entity — two near-identical files that drifted, so three entities
 * validated differently depending on which one you opened.
 */
const AirlineFormModal = ({ open, onOpenChange, airline }: AirlineFormModalProps) => {
  const isEdit = Boolean(airline);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ICreateAirlineFormValues) =>
      isEdit && airline
        ? updateAirlineAction(airline.id, values)
        : createAirlineAction(values),
  });

  const form = useForm({
    defaultValues: airline
      ? {
          name: airline.name,
          shortCode: airline.shortCode,
          logoUrl: airline.logoUrl ?? "",
          remark: airline.remark ?? "",
        }
      : emptyValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      // All six, in order. Dropping any one leaves a stale view somewhere:
      // invalidate marks stale, refetch forces the mounted table to reload now
      // rather than on next focus, and router.refresh re-runs the Server
      // Component so the prefetched half agrees with the client half.
      toast.success(result.message || (isEdit ? "Airline updated" : "Airline created"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["airlines"] });
      void queryClient.refetchQueries({ queryKey: ["airlines"], type: "active" });
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
        // A half-filled form must not vanish on a stray outside click.
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit airline" : "Add airline"}</DialogTitle>
          <DialogDescription>
            The short code is what staff type when issuing a ticket, so keep it to the
            two-letter IATA code where there is one.
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
          <form.Field name="name" validators={{ onChange: createAirlineFormZodSchema.shape.name }}>
            {(field) => (
              <AppField
                field={field}
                label="Airline name"
                placeholder="e.g. Biman Bangladesh Airlines"
                disabled={isPending}
              />
            )}
          </form.Field>

          <form.Field
            name="shortCode"
            validators={{ onChange: createAirlineFormZodSchema.shape.shortCode }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Short code"
                placeholder="BG"
                disabled={isPending}
                hint="Stored uppercase. Must be unique within your agency."
                className="font-mono uppercase"
              />
            )}
          </form.Field>

          <form.Field
            name="logoUrl"
            validators={{ onChange: createAirlineFormZodSchema.shape.logoUrl }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Logo URL"
                placeholder="https://..."
                disabled={isPending}
                hint="Optional"
              />
            )}
          </form.Field>

          {/* AppField covers single-line inputs only, so a textarea is hand-rolled. */}
          <form.Field name="remark">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Remark</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  rows={3}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Anything worth noting about this airline..."
                  disabled={isPending}
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

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
              {([canSubmit, isSubmitting]) => (
                <AppSubmitButton
                  isPending={isSubmitting || isPending}
                  pendingLabel={isEdit ? "Saving..." : "Adding..."}
                  disabled={!canSubmit}
                  className="w-auto"
                >
                  {isEdit ? "Save changes" : "Add airline"}
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AirlineFormModal;
