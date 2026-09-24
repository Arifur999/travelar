"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  RiFileCopyLine,
  RiKey2Line,
  RiLockLine,
  RiLockUnlockLine,
  RiRefreshLine,
  RiShieldFlashLine,
} from "@remixicon/react";
import { toast } from "sonner";
import {
  resetTeamMemberPasswordAction,
  updateTeamMemberAction,
  updateTeamMemberStatusAction,
} from "@/app/(dashboardLayout)/dashboard/team/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  canGrantAdmin,
  generateTemporaryPassword,
  getManageBlocker,
  type TeamViewer,
} from "@/lib/teamPermissions";
import { TEAM_ROLE_OPTIONS, USER_ROLE_LABELS } from "@/types/enums.types";
import { type ITeamMember, type TeamRole } from "@/types/team.types";
import {
  resetTeamMemberPasswordFormZodSchema,
  updateTeamMemberFormZodSchema,
  type IUpdateTeamMemberFormValues,
} from "@/zod/team.validation";

interface ManageMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: ITeamMember;
  viewer: TeamViewer;
}

/**
 * Details, access and password for one member, in one place. DataTable only
 * offers view / edit / delete, and block and reset are not deletes, so they
 * live here under "Edit" rather than as a hand-rolled actions column.
 */
const ManageMemberDialog = ({ open, onOpenChange, member, viewer }: ManageMemberDialogProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const blocker = getManageBlocker(viewer, member);
  const mayGrantAdmin = canGrantAdmin(viewer);

  const [isConfirmingStatus, setIsConfirmingStatus] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["team"] });
    void queryClient.invalidateQueries({ queryKey: ["agency-profile"] });
    void queryClient.refetchQueries({ queryKey: ["team"], type: "active" });
    router.refresh();
  };

  const { mutateAsync: saveDetails, isPending: isSaving } = useMutation({
    mutationFn: (values: IUpdateTeamMemberFormValues) =>
      updateTeamMemberAction(member.id, {
        name: values.name,
        // Only sent when it changed: the API signs the member out on a role
        // change, and re-saving the same role should not do that.
        role: values.role !== member.role ? values.role : undefined,
      }),
  });

  const { mutateAsync: setStatus, isPending: isChangingStatus } = useMutation({
    mutationFn: (status: "ACTIVE" | "BLOCKED") => updateTeamMemberStatusAction(member.id, { status }),
  });

  const { mutateAsync: resetPassword, isPending: isResetting } = useMutation({
    mutationFn: (password: string) =>
      resetTeamMemberPasswordAction(member.id, { newPassword: password }),
  });

  const defaultValues: IUpdateTeamMemberFormValues = { name: member.name, role: member.role };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const roleChanged = value.role !== member.role;
      const result = await saveDetails(value);

      if (!result.success) {
        toast.error(result.message || "Failed to update the member");
        return;
      }

      toast.success(
        roleChanged ? `${value.name} is now ${USER_ROLE_LABELS[value.role]}` : "Member updated",
        roleChanged ? { description: "They were signed out and will see the new role on their next login." } : undefined,
      );
      onOpenChange(false);
      form.reset();
      refresh();
    },
  });

  const isBlocked = member.status === "BLOCKED";

  const handleStatus = async () => {
    const result = await setStatus(isBlocked ? "ACTIVE" : "BLOCKED");
    if (!result.success) {
      toast.error(result.message || "Failed to change the status");
      return;
    }
    toast.success(result.message || (isBlocked ? "Member reactivated" : "Member blocked"));
    setIsConfirmingStatus(false);
    onOpenChange(false);
    refresh();
  };

  const passwordError =
    newPassword.length > 0
      ? resetTeamMemberPasswordFormZodSchema.shape.newPassword.safeParse(newPassword).error?.issues[0]
          ?.message
      : undefined;

  const handleReset = async () => {
    const result = await resetPassword(newPassword);
    if (!result.success) {
      toast.error(result.message || "Failed to reset the password");
      return;
    }
    toast.success("Password reset", {
      description: "Share the new temporary password — they were signed out and must replace it.",
    });
    // The dialog deliberately stays open with the password still in the field:
    // closing it here would throw away the one copy the admin has to hand over.
    refresh();
  };

  const copyNewPassword = async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
      toast.success("Password copied");
    } catch {
      toast.error("Could not copy — select it and copy by hand");
    }
  };

  const isBusy = isSaving || isChangingStatus || isResetting;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen);
          if (!nextOpen) {
            form.reset();
            setNewPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg" onInteractOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{member.name}</DialogTitle>
            <DialogDescription>{member.email}</DialogDescription>
          </DialogHeader>

          {blocker ? (
            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
              <RiShieldFlashLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p>{blocker}</p>
            </div>
          ) : (
            <div className="space-y-5">
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
                <form.Field name="name" validators={{ onChange: updateTeamMemberFormZodSchema.shape.name }}>
                  {(field) => <AppField field={field} label="Full name" disabled={isBusy} />}
                </form.Field>

                <form.Field name="role">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Role</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(next) => field.handleChange(next as TeamRole)}
                        disabled={isBusy || !mayGrantAdmin}
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
                          ? "Changing the role signs them out so the new one applies at their next login."
                          : "Only the agency owner can change roles."}
                      </p>
                    </div>
                  )}
                </form.Field>

                <div className="flex justify-end">
                  <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty] as const}
                  >
                    {([canSubmit, isSubmitting, isDirty]) => (
                      <AppSubmitButton
                        isPending={isSubmitting || isSaving}
                        pendingLabel="Saving..."
                        disabled={!canSubmit || !isDirty || isBusy}
                        className="w-auto"
                      >
                        Save details
                      </AppSubmitButton>
                    )}
                  </form.Subscribe>
                </div>
              </form>

              <Separator />

              <section className="space-y-2" aria-labelledby="member-access">
                <h3 id="member-access" className="text-sm font-medium">
                  Access
                </h3>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {isBlocked
                      ? "Blocked — they cannot sign in. Their past records stay."
                      : "Blocking signs them out everywhere, immediately."}
                  </p>
                  <Button
                    type="button"
                    variant={isBlocked ? "outline" : "destructive"}
                    size="sm"
                    disabled={isBusy}
                    onClick={() => setIsConfirmingStatus(true)}
                  >
                    {isBlocked ? (
                      <RiLockUnlockLine className="size-3.5" aria-hidden="true" />
                    ) : (
                      <RiLockLine className="size-3.5" aria-hidden="true" />
                    )}
                    {isBlocked ? "Reactivate" : "Block"}
                  </Button>
                </div>
              </section>

              <Separator />

              <section className="space-y-2" aria-labelledby="member-password">
                <h3 id="member-password" className="text-sm font-medium">
                  Reset password
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sets a new temporary password and signs them out. They must replace it at their
                  next login.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="member-new-password" className="sr-only">
                    New temporary password
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="member-new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="New temporary password"
                      autoComplete="new-password"
                      disabled={isBusy}
                      aria-invalid={Boolean(passwordError)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isBusy}
                      onClick={() => setNewPassword(generateTemporaryPassword())}
                      aria-label="Generate a password"
                    >
                      <RiRefreshLine className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isBusy || !newPassword}
                      onClick={copyNewPassword}
                      aria-label="Copy the password"
                    >
                      <RiFileCopyLine className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                  {passwordError && (
                    <p role="alert" className="text-sm text-destructive">
                      {passwordError}
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isBusy || newPassword.length < 8}
                    onClick={handleReset}
                  >
                    <RiKey2Line className="size-3.5" aria-hidden="true" />
                    {isResetting ? "Resetting..." : "Reset password"}
                  </Button>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isConfirmingStatus}
        onOpenChange={setIsConfirmingStatus}
        onConfirm={handleStatus}
        isPending={isChangingStatus}
        destructive={!isBlocked}
        title={isBlocked ? `Reactivate ${member.name}?` : `Block ${member.name}?`}
        confirmLabel={isBlocked ? "Reactivate" : "Block"}
        pendingLabel={isBlocked ? "Reactivating..." : "Blocking..."}
        description={
          isBlocked
            ? "They can sign in again with their current password."
            : "They are signed out on every device right away and cannot sign in until reactivated. Everything they recorded stays."
        }
      />
    </>
  );
};

export default ManageMemberDialog;
