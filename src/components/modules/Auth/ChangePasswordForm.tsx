"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction } from "@/app/(dashboardLayout)/change-password/_action";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import { Button } from "@/components/ui/button";
import {
  changePasswordFieldsZodSchema,
  changePasswordFormZodSchema,
  type IChangePasswordFormValues,
} from "@/zod/auth.validation";

const defaultValues: IChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const ChangePasswordForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: { currentPassword: string; newPassword: string }) =>
      changePasswordAction(values),
  });

  const togglePassword = useCallback(() => setShowPassword((shown) => !shown), []);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      // Both cross-field rules (match, and differs from current) live on the
      // whole object, so they cannot attach to a single field validator.
      const parsed = changePasswordFormZodSchema.safeParse(value);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Please check the form");
        return;
      }

      const result = await mutateAsync({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
      });

      if (!result.success) {
        toast.error(result.message || "Failed to change password");
        return;
      }

      toast.success("Password changed — please sign in again");
      form.reset();

      // The action cleared the cookies, so there is no session left to render
      // the dashboard with.
      router.push("/login");
      router.refresh();
    },
  });

  const revealToggle = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground"
      onClick={togglePassword}
      aria-label={showPassword ? "Hide passwords" : "Show passwords"}
    >
      {showPassword ? (
        <EyeOff className="size-4" aria-hidden="true" />
      ) : (
        <Eye className="size-4" aria-hidden="true" />
      )}
    </Button>
  );

  return (
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
        name="currentPassword"
        validators={{ onChange: changePasswordFieldsZodSchema.shape.currentPassword }}
      >
        {(field) => (
          <AppField
            field={field}
            label="Current password"
            type={showPassword ? "text" : "password"}
            disabled={isPending}
            append={revealToggle}
          />
        )}
      </form.Field>

      <form.Field
        name="newPassword"
        validators={{ onChange: changePasswordFieldsZodSchema.shape.newPassword }}
      >
        {(field) => (
          <AppField
            field={field}
            label="New password"
            type={showPassword ? "text" : "password"}
            disabled={isPending}
            hint="At least 8 characters"
          />
        )}
      </form.Field>

      <form.Field
        name="confirmPassword"
        validators={{ onChange: changePasswordFieldsZodSchema.shape.confirmPassword }}
      >
        {(field) => (
          <AppField
            field={field}
            label="Confirm new password"
            type={showPassword ? "text" : "password"}
            disabled={isPending}
          />
        )}
      </form.Field>

      <p className="text-xs text-muted-foreground">
        Changing your password signs you out of every other device.
      </p>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <AppSubmitButton
            isPending={isSubmitting || isPending}
            pendingLabel="Updating..."
            disabled={!canSubmit}
          >
            Change password
          </AppSubmitButton>
        )}
      </form.Subscribe>
    </form>
  );
};

export default ChangePasswordForm;
