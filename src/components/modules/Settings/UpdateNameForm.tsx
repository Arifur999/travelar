"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateMyProfileAction } from "@/app/(dashboardLayout)/my-profile/_action";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import { updateMyProfileFormZodSchema } from "@/zod/team.validation";

/**
 * The one thing about an account its owner can change themselves. Email is the
 * login and role is an admin's decision, so neither is offered.
 */
const UpdateNameForm = ({ currentName }: { currentName: string }) => {
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (name: string) => updateMyProfileAction({ name }),
  });

  const form = useForm({
    defaultValues: { name: currentName },
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value.name);

      if (!result.success) {
        toast.error(result.message || "Failed to update your name");
        return;
      }

      toast.success("Name updated");
      form.reset({ name: result.data.name });
      // The page, sidebar and user menu all read the name from the server.
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
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <form.Field name="name" validators={{ onChange: updateMyProfileFormZodSchema.shape.name }}>
          {(field) => <AppField field={field} label="Display name" disabled={isPending} />}
        </form.Field>
      </div>
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty] as const}
      >
        {([canSubmit, isSubmitting, isDirty]) => (
          <AppSubmitButton
            isPending={isSubmitting || isPending}
            pendingLabel="Saving..."
            disabled={!canSubmit || !isDirty}
            className="w-auto sm:mt-6"
          >
            Save
          </AppSubmitButton>
        )}
      </form.Subscribe>
    </form>
  );
};

export default UpdateNameForm;
