"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { RiMailCheckLine } from "@remixicon/react";
import { toast } from "sonner";
import { forgotPasswordAction } from "@/app/(authLayout)/forgot-password/_action";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import { Button } from "@/components/ui/button";
import {
  forgotPasswordFormZodSchema,
  type IForgotPasswordFormValues,
} from "@/zod/auth.validation";

const defaultValues: IForgotPasswordFormValues = { email: "" };

const ForgotPasswordForm = () => {
  // The address the link was sent to, once sent. The confirmation deliberately
  // reads the same whether or not an account exists — that is the API's rule
  // and the page must not undo it.
  const [sentTo, setSentTo] = useState<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IForgotPasswordFormValues) => forgotPasswordAction(values),
  });

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        // Only a rate limit or an outage lands here, never "no such account".
        toast.error(result.message || "Could not send a reset link");
        return;
      }

      setSentTo(value.email.trim());
      form.reset();
    },
  });

  if (sentTo) {
    return (
      <div className="space-y-5 text-center" role="status">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <RiMailCheckLine className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <p className="font-medium">Check your inbox</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{sentTo}</span>,
            we have sent a link to choose a new password. It works once and expires in an hour.
          </p>
          <p className="text-xs text-muted-foreground">Nothing there? Check spam, or try again in a few minutes.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
          <Button asChild variant="ghost">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

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
      <form.Field name="email" validators={{ onChange: forgotPasswordFormZodSchema.shape.email }}>
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

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <AppSubmitButton
            isPending={isSubmitting || isPending}
            pendingLabel="Sending link..."
            disabled={!canSubmit}
          >
            Send reset link
          </AppSubmitButton>
        )}
      </form.Subscribe>
    </form>
  );
};

export default ForgotPasswordForm;
