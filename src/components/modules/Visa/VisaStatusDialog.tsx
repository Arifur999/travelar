"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { changeVisaStatusAction } from "@/app/(dashboardLayout)/dashboard/visa/_action";
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
import { Textarea } from "@/components/ui/textarea";
import { VISA_STATUS_LABELS } from "@/types/enums.types";
import {
  VISA_TRANSITIONS,
  type IVisaCase,
} from "@/types/visa.types";
import {
  visaStatusFieldsZodSchema,
  type IVisaStatusFormValues,
} from "@/zod/visa.validation";

interface VisaStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visaCase: IVisaCase;
}

const DESCRIPTIONS: Record<string, string> = {
  PROCESSING: "The application is with the embassy or agent.",
  APPROVED: "The visa was granted. Next step is handing it to the applicant.",
  REJECTED: "The application was refused. Final — the fees already billed stay billed.",
  DELIVERED: "The visa has been handed over. Final.",
};

/**
 * Offers only the transitions VISA_TRANSITIONS permits from the current state.
 *
 * Stricter than the ticket machine: a case must pass through PROCESSING before
 * it can be approved or rejected, so the dropdown often has exactly one option.
 */
const VisaStatusDialog = ({ open, onOpenChange, visaCase }: VisaStatusDialogProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const allowed = VISA_TRANSITIONS[visaCase.status];

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IVisaStatusFormValues) =>
      changeVisaStatusAction(visaCase.id, values),
  });

  const defaultValues: IVisaStatusFormValues = {
    status: (allowed[0] ?? "PROCESSING") as IVisaStatusFormValues["status"],
    note: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Failed to change status");
        return;
      }

      toast.success(result.message || "Status updated");
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["visa-cases"] });
      void queryClient.invalidateQueries({ queryKey: ["visa-case", visaCase.id] });
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
        className="sm:max-w-md"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Move this case forward</DialogTitle>
          <DialogDescription>
            Currently {VISA_STATUS_LABELS[visaCase.status]}. The lifecycle is one-way.
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
          <form.Field name="status">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>New status</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(next) =>
                    field.handleChange(next as IVisaStatusFormValues["status"])
                  }
                  disabled={isPending || allowed.length <= 1}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowed.map((status) => (
                      <SelectItem key={status} value={status}>
                        {VISA_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {DESCRIPTIONS[field.state.value]}
                </p>
              </div>
            )}
          </form.Field>

          <form.Field
            name="note"
            validators={{ onChange: visaStatusFieldsZodSchema.shape.note }}
          >
            {(field) => (
              <div className="space-y-1.5">
                {/* The API stores a rejection note on the case itself, so that
                    transition is worth prompting for specifically. */}
                <form.Subscribe selector={(state) => state.values.status}>
                  {(status) => (
                    <Label htmlFor={field.name}>
                      {status === "REJECTED" ? "Reason for refusal" : "Note"}
                    </Label>
                  )}
                </form.Subscribe>
                <Textarea
                  id={field.name}
                  name={field.name}
                  rows={3}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Kept in the case&apos;s history.
                </p>
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
                  pendingLabel="Updating..."
                  disabled={!canSubmit}
                  className="w-auto"
                >
                  Change status
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VisaStatusDialog;
