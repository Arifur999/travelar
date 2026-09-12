"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { loginAction } from "@/app/(authLayout)/login/_action";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import { Button } from "@/components/ui/button";
import { getDefaultDashboardRoute, isValidRedirectForRole } from "@/lib/authUtils";
import { loginFormZodSchema, type ILoginFormValues } from "@/zod/auth.validation";

const defaultValues: ILoginFormValues = { email: "", password: "" };

const LoginForm = ({ redirectTo }: { redirectTo?: string }) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ILoginFormValues) => loginAction(values),
  });

  const togglePassword = useCallback(() => setShowPassword((shown) => !shown), []);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Failed to sign you in");
        return;
      }

      const { user } = result.data;

      toast.success(result.message || "Signed in successfully");
      form.reset();

      // Honour ?redirect= only when the signed-in role actually owns that
      // route — otherwise a crafted login link could bounce someone into the
      // wrong half of the product, and the redirect would leak which routes
      // exist.
      const target =
        redirectTo && isValidRedirectForRole(redirectTo, user.role)
          ? redirectTo
          : getDefaultDashboardRoute(user.role);

      router.push(target);
      // The proxy and every Server Component read the cookies this action just
      // set; without a refresh the shell renders from the signed-out cache.
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
      <form.Field name="email" validators={{ onChange: loginFormZodSchema.shape.email }}>
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

      <form.Field name="password" validators={{ onChange: loginFormZodSchema.shape.password }}>
        {(field) => (
          <AppField
            field={field}
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Your password"
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
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </Button>
            }
          />
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <AppSubmitButton
            isPending={isSubmitting || isPending}
            pendingLabel="Signing in..."
            disabled={!canSubmit}
          >
            Sign in
          </AppSubmitButton>
        )}
      </form.Subscribe>
    </form>
  );
};

export default LoginForm;
