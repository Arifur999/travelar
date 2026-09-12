"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createRouteAction,
  updateRouteAction,
} from "@/app/(dashboardLayout)/dashboard/routes/_action";
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
  createRouteFormZodSchema,
  type ICreateRouteFormValues,
} from "@/zod/masterData.validation";
import { type IRoute } from "@/types/masterData.types";

interface RouteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route?: IRoute | null;
}

const emptyValues: ICreateRouteFormValues = { name: "", remark: "" };

const RouteFormModal = ({ open, onOpenChange, route }: RouteFormModalProps) => {
  const isEdit = Boolean(route);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ICreateRouteFormValues) =>
      isEdit && route ? updateRouteAction(route.id, values) : createRouteAction(values),
  });

  const form = useForm({
    defaultValues: route
      ? { name: route.name, remark: route.remark ?? "" }
      : emptyValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Route updated" : "Route created"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["routes"] });
      void queryClient.refetchQueries({ queryKey: ["routes"], type: "active" });
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
          <DialogTitle>{isEdit ? "Edit sector" : "Add sector"}</DialogTitle>
          <DialogDescription>
            Write the sector the way your staff do — <code>DAC-SIN</code> for a one-way, or{" "}
            <code>YYZ-DAC-YYZ</code> for a multi-leg return.
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
          <form.Field name="name" validators={{ onChange: createRouteFormZodSchema.shape.name }}>
            {(field) => (
              <AppField
                field={field}
                label="Sector"
                placeholder="DAC-SIN"
                disabled={isPending}
                hint="Must be unique within your agency."
                className="font-mono uppercase"
              />
            )}
          </form.Field>

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
                  placeholder="Anything worth noting about this sector..."
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
                  {isEdit ? "Save changes" : "Add sector"}
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RouteFormModal;
