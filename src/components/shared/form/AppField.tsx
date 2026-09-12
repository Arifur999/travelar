"use client";

import { type AnyFieldApi } from "@tanstack/react-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AppFieldProps {
  field: AnyFieldApi;
  label: string;
  type?: "text" | "email" | "password" | "number" | "date" | "time" | "tel";
  placeholder?: string;
  /** Absolutely positioned inside the right edge — this is how the password reveal toggle works. */
  append?: React.ReactNode;
  /** Absolutely positioned inside the left edge, for a currency symbol or icon. */
  prepend?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  /** Rendered under the input when there is no error. */
  hint?: string;
}

/**
 * Single-line inputs only. Textareas, selects and multi-selects are hand-rolled
 * in the form with `<Label htmlFor={field.name}>` + `field.handleChange`.
 */
const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return String(error);
};

const AppField = ({
  field,
  label,
  type = "text",
  placeholder,
  append,
  prepend,
  className,
  disabled,
  hint,
}: AppFieldProps) => {
  // Only show an error once the user has actually touched the field —
  // validating an untouched empty form paints it red before anyone has typed.
  const firstError =
    field.state.meta.isTouched && field.state.meta.errors.length > 0
      ? getErrorMessage(field.state.meta.errors[0])
      : null;
  const hasError = firstError !== null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.name}>{label}</Label>

      <div className="relative">
        {prepend && (
          <span className="absolute inset-y-0 left-0 flex w-10 items-center justify-center text-muted-foreground">
            {prepend}
          </span>
        )}

        <Input
          id={field.name}
          name={field.name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          value={field.state.value ?? ""}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${field.name}-error` : hint ? `${field.name}-hint` : undefined
          }
          className={cn(
            prepend && "pl-10",
            append && "pr-10",
            hasError && "border-destructive focus-visible:ring-destructive/20",
            className,
          )}
        />

        {append && (
          <span className="absolute inset-y-0 right-0 flex w-10 items-center justify-center">
            {append}
          </span>
        )}
      </div>

      {hasError ? (
        <p role="alert" id={`${field.name}-error`} className="text-sm text-destructive">
          {firstError}
        </p>
      ) : hint ? (
        <p id={`${field.name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export default AppField;
