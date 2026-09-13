"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/app/(dashboardLayout)/dashboard/expenses/_action";
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
import { toNumber } from "@/lib/format";
import {
  createCategoryFormZodSchema,
  type ICreateCategoryFormValues,
} from "@/zod/expense.validation";
import { type IExpenseCategory } from "@/types/expense.types";

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: IExpenseCategory | null;
}

const CategoryFormModal = ({ open, onOpenChange, category }: CategoryFormModalProps) => {
  const isEdit = Boolean(category);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ICreateCategoryFormValues) =>
      isEdit && category
        ? updateCategoryAction(category.id, values)
        : createCategoryAction(values),
  });

  const defaultValues: ICreateCategoryFormValues = category
    ? {
        name: category.name,
        color: category.color ?? "",
        monthlyBudget: String(toNumber(category.monthlyBudget)),
        yearlyBudget: String(toNumber(category.yearlyBudget)),
      }
    : { name: "", color: "", monthlyBudget: "", yearlyBudget: "" };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Something went wrong");
        return;
      }

      toast.success(result.message || (isEdit ? "Category updated" : "Category created"));
      onOpenChange(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      void queryClient.invalidateQueries({ queryKey: ["expense-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
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
          <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>
            Buckets your spending reports under. A monthly budget turns on usage tracking for
            that category.
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
            validators={{ onChange: createCategoryFormZodSchema.shape.name }}
          >
            {(field) => (
              <AppField
                field={field}
                label="Name"
                placeholder="e.g. Office rent, Marketing"
                disabled={isPending}
                hint="Must be unique within your agency."
              />
            )}
          </form.Field>

          <form.Field
            name="color"
            validators={{ onChange: createCategoryFormZodSchema.shape.color }}
          >
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Colour</Label>
                <div className="flex items-center gap-2">
                  {/* A native colour input cannot be empty, so it is paired with
                      the text field rather than being the only control — leaving
                      the text blank lets the API assign a preset. */}
                  <input
                    type="color"
                    value={field.state.value || "#2563eb"}
                    onChange={(event) => field.handleChange(event.target.value)}
                    disabled={isPending}
                    aria-label="Pick a colour"
                    className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
                  />
                  <input
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="#2563eb"
                    disabled={isPending}
                    className="h-9 flex-1 rounded-md border bg-transparent px-3 font-mono text-sm"
                  />
                </div>
                {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                  <p role="alert" className="text-sm text-destructive">
                    Colour must be a hex value like #2563eb
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Leave blank and one is picked from a preset list.
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="monthlyBudget"
              validators={{ onChange: createCategoryFormZodSchema.shape.monthlyBudget }}
            >
              {(field) => (
                <AppField
                  field={field}
                  label="Monthly budget"
                  placeholder="0.00"
                  disabled={isPending}
                  prepend={<span className="text-sm">৳</span>}
                  hint="Optional"
                />
              )}
            </form.Field>

            <form.Field
              name="yearlyBudget"
              validators={{ onChange: createCategoryFormZodSchema.shape.yearlyBudget }}
            >
              {(field) => (
                <AppField
                  field={field}
                  label="Yearly budget"
                  placeholder="0.00"
                  disabled={isPending}
                  prepend={<span className="text-sm">৳</span>}
                  hint="Optional"
                />
              )}
            </form.Field>
          </div>

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
                  {isEdit ? "Save changes" : "Add category"}
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryFormModal;
