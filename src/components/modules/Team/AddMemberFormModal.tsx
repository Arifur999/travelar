"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiEyeLine, RiEyeOffLine, RiFileCopyLine, RiRefreshLine } from "@remixicon/react";
import { toast } from "sonner";
import { createTeamMemberAction } from "@/app/(dashboardLayout)/dashboard/team/_action";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { canGrantAdmin, generateTemporaryPassword, type TeamViewer } from "@/lib/teamPermissions";
import { TEAM_ROLE_OPTIONS } from "@/types/enums.types";
import { type TeamRole } from "@/types/team.types";
import {
  createTeamMemberFormZodSchema,
  type ICreateTeamMemberFormValues,
} from "@/zod/team.validation";

interface AddMemberFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewer: TeamViewer;
}

const emptyValues: ICreateTeamMemberFormValues = {
  name: "",
  email: "",
  password: "",
  role: "AGENCY_STAFF",
};

const AddMemberFormModal = ({ open, onOpenChange, viewer }: AddMemberFormModalProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const mayGrantAdmin = canGrantAdmin(viewer);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ICreateTeamMemberFormValues) => createTeamMemberAction(values),
  });

  const form = useForm({
    defaultValues: emptyValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Failed to add the member");
        return;
      }

      toast.success(`${result.data.name} added`, {
        description: "Share the temporary password with them — they choose their own at first login.",
      });
      onOpenChange(false);
      form.reset();
      setShowPassword(false);
      void queryClient.invalidateQueries({ queryKey: ["team"] });
      void queryClient.invalidateQueries({ queryKey: ["agency-profile"] });
      void queryClient.refetchQueries({ queryKey: ["team"], type: "active" });
      router.refresh();
    },
  });

  const copyPassword = async () => {
    const password = form.getFieldValue("password");
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied");
    } catch {
      toast.error("Could not copy — select it and copy by hand");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          form.reset();
          setShowPassword(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-md" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add a team member</DialogTitle>
          <DialogDescription>
            They sign in with this email and a temporary password, then must set their own.
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
          className="space-y-4"
        >
          <form.Field name="name" validators={{ onChange: createTeamMemberFormZodSchema.shape.name }}>
            {(field) => <AppField field={field} label="Full name" disabled={isPending} />}
          </form.Field>

          <form.Field name="email" validators={{ onChange: createTeamMemberFormZodSchema.shape.email }}>
            {(field) => (
              <AppField
                field={field}
                label="Email"
                type="email"
                placeholder="name@agency.com"
                disabled={isPending}
                hint="Used to sign in. It must not belong to any other account."
              />
            )}
          </form.Field>

          <form.Field name="role">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Role</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(next) => field.handleChange(next as TeamRole)}
                  disabled={isPending || !mayGrantAdmin}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {mayGrantAdmin
                    ? "Admins can manage staff, billing and deletes. Staff cannot delete records."
                    : "Only the agency owner can add another admin, so new members join as staff."}
                </p>
              </div>
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{ onChange: createTeamMemberFormZodSchema.shape.password }}
          >
            {(field) => (
              <div className="space-y-2">
                <AppField
                  field={field}
                  label="Temporary password"
                  type={showPassword ? "text" : "password"}
                  disabled={isPending}
                  append={
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <RiEyeOffLine className="size-4" aria-hidden="true" />
                      ) : (
                        <RiEyeLine className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  }
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      field.handleChange(generateTemporaryPassword());
                      setShowPassword(true);
                    }}
                  >
                    <RiRefreshLine className="size-3.5" aria-hidden="true" />
                    Generate
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending || !field.state.value}
                    onClick={copyPassword}
                  >
                    <RiFileCopyLine className="size-3.5" aria-hidden="true" />
                    Copy
                  </Button>
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
                  pendingLabel="Adding..."
                  disabled={!canSubmit}
                  className="w-auto"
                >
                  Add member
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberFormModal;
