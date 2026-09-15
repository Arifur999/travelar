"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { resetPasswordAction } from "@/app/(authLayout)/reset-password/_action";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import { Button } from "@/components/ui/button";
import {
  resetPasswordFieldsZodSchema,
  resetPasswordFormZodSchema,
  type IResetPasswordFormValues,
} from "@/zod/auth.validation";

const defaultValues: IResetPasswordFormValues = { newPassword: "", confirmPassword: "" };

const ResetPasswordForm = ({ token }: { token: string }) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = useCallback(() => setShowPassword((shown) => !shown), []);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (newPassword: string) => resetPasswordAction({ token, newPassword }),
  });

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      // The match rule spans two fields, so it is checked on the whole object.
      const parsed = resetPasswordFormZodSchema.safeParse(value);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Please check the form");
        return;
      }

      const result = await mutateAsync(value.newPassword);

      if (!result.success) {
        toast.error(result.message || "Could not reset your password");
        return;
      }

      toast.success("Password reset — sign in with your new password");
      form.reset();
      router.replace("/login?reset=success");
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
      {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
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
      <form.Field name="newPassword" validators={{ onChange: resetPasswordFieldsZodSchema.shape.newPassword }}>
        {(field) => (
          <AppField
            field={field}
            label="New password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            disabled={isPending}
            append={revealToggle}
          />
        )}
      </form.Field>

      <form.Field
        name="confirmPassword"
        validators={{ onChange: resetPasswordFieldsZodSchema.shape.confirmPassword }}
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
        Saving signs you out on every device, including anywhere someone else may be using your
        old password.
      </p>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <AppSubmitButton isPending={isSubmitting || isPending} pendingLabel="Saving..." disabled={!canSubmit}>
            Set new password
          </AppSubmitButton>
        )}
      </form.Subscribe>
    </form>
  );
};

export default ResetPasswordForm;
