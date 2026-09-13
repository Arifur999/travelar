"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createVisaAgentAction,
  updateVisaAgentAction,
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
import { Textarea } from "@/components/ui/textarea";
import {
  visaAgentFieldsZodSchema,
  type IVisaAgentFormValues,
} from "@/zod/visa.validation";
import { type IVisaAgent } from "@/types/visa.types";

interface VisaAgentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: IVisaAgent | null;
}

const VisaAgentFormModal = ({ open, onOpenChange, agent }: VisaAgentFormModalProps) => {
  const isEdit = Boolean(agent);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IVisaAgentFormValues) =>
      isEdit && agent ? updateVisaAgentAction(agent.id, values) : createVisaAgentAction(values),
  });

  const defaultValues: IVisaAgentFormValues = agent
    ? {
        name: agent.name,
        type: agent.type ?? "",
        contact: agent.contact ?? "",
        email: agent.email ?? "",
        address: agent.address ?? "",
        note: agent.note ?? "",
      }
    : { name: "", type: "", contact: "", email: "", address: "", note: "" };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Agent updated" : "Agent created"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["visa-agents"] });
      void queryClient.refetchQueries({ queryKey: ["visa-agents"], type: "active" });
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
          <DialogTitle>{isEdit ? "Edit agent" : "Add agent"}</DialogTitle>
          <DialogDescription>
            An embassy, consultancy or agent a case can be routed through.
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
          <form.Field
            name="name"
            validators={{ onChange: visaAgentFieldsZodSchema.shape.name }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Name"
                placeholder="e.g. Gulf Visa Services"
                disabled={isPending}
              />
            )}
          </form.Field>

          <form.Field
            name="type"
            validators={{ onChange: visaAgentFieldsZodSchema.shape.type }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Type"
                placeholder="e.g. Embassy, Consultancy"
                disabled={isPending}
                hint="Optional"
              />
            )}
          </form.Field>

          <form.Field
            name="contact"
            validators={{ onChange: visaAgentFieldsZodSchema.shape.contact }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Contact"
                placeholder="Phone or contact person"
                disabled={isPending}
                hint="Optional"
              />
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <AppField
                field={field}
                label="Email"
                type="email"
                placeholder="name@example.com"
                disabled={isPending}
                hint="Optional"
              />
            )}
          </form.Field>

          <form.Field name="address">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Address</Label>
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
                  {isEdit ? "Save changes" : "Add agent"}
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VisaAgentFormModal;
