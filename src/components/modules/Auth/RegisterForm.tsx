"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { toast } from "sonner";
import { registerAction } from "@/app/(authLayout)/register/_action";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import { Button } from "@/components/ui/button";
import { getDefaultDashboardRoute } from "@/lib/authUtils";
import {
  registerFieldsZodSchema,
  registerFormZodSchema,
  type IRegisterFormValues,
} from "@/zod/auth.validation";

const defaultValues: IRegisterFormValues = {
  agencyName: "",
  agencyPhone: "",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const RegisterForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: Omit<IRegisterFormValues, "confirmPassword">) => registerAction(values),
  });

  const togglePassword = useCallback(() => setShowPassword((shown) => !shown), []);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      // The password match lives on the whole object, so it cannot attach to a
      // single field validator — check it here before the round-trip.
      const parsed = registerFormZodSchema.safeParse(value);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Please check the form");
        return;
      }

      // Built field by field rather than by dropping confirmPassword from a
      // spread — this way a new form field is never posted to the API by
      // accident just because someone added it to defaultValues.
      const result = await mutateAsync({
        agencyName: value.agencyName,
        agencyPhone: value.agencyPhone,
        name: value.name,
        email: value.email,
        password: value.password,
      });

      if (!result.success) {
        toast.error(result.message || "Failed to complete registration");
        return;
      }

      toast.success(result.message || "Agency registered successfully");
      form.reset();

      // Registration signs the admin in, so go straight to the workspace.
      router.push(getDefaultDashboardRoute(result.data.user.role));
      router.refresh();
    },
  });

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
        name="agencyName"
        validators={{ onChange: registerFieldsZodSchema.shape.agencyName }}
      >
        {(field) => (
          <AppField
            field={field}
            label="Agency name"
            placeholder="e.g. Skyline Travels"
            disabled={isPending}
          />
        )}
      </form.Field>

      <form.Field name="agencyPhone">
        {(field) => (
          <AppField
            field={field}
            label="Agency phone"
            type="tel"
            placeholder="01XXXXXXXXX"
            disabled={isPending}
            hint="Optional"
          />
        )}
      </form.Field>

      <form.Field name="name" validators={{ onChange: registerFieldsZodSchema.shape.name }}>
        {(field) => (
          <AppField
            field={field}
            label="Your name"
            placeholder="Full name"
            disabled={isPending}
          />
        )}
      </form.Field>

      <form.Field name="email" validators={{ onChange: registerFieldsZodSchema.shape.email }}>
        {(field) => (
          <AppField
            field={field}
            label="Email"
            type="email"
            placeholder="you@agency.com"
            disabled={isPending}
          />
        )}
      </form.Field>

      <form.Field name="password" validators={{ onChange: registerFieldsZodSchema.shape.password }}>
        {(field) => (
          <AppField
            field={field}
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            disabled={isPending}
            append={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                onClick={togglePassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <RiEyeOffLine className="size-4" aria-hidden="true" />
                ) : (
                  <RiEyeLine className="size-4" aria-hidden="true" />
                )}
              </Button>
            }
          />
        )}
      </form.Field>

      <form.Field
        name="confirmPassword"
        validators={{ onChange: registerFieldsZodSchema.shape.confirmPassword }}
      >
        {(field) => (
          <AppField
            field={field}
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            placeholder="Repeat your password"
            disabled={isPending}
          />
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <AppSubmitButton
            isPending={isSubmitting || isPending}
            pendingLabel="Creating your workspace..."
            disabled={!canSubmit}
          >
            Create agency
          </AppSubmitButton>
        )}
      </form.Subscribe>
    </form>
  );
};

export default RegisterForm;
