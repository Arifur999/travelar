import { z } from "@/lib/zod";
import {
  type IChangePasswordPayload,
  type IForgotPasswordPayload,
  type ILoginPayload,
  type IRegisterPayload,
  type IResetPasswordPayload,
} from "@/types/user.types";

/**
 * Two schemas per entity.
 *
 * A. Form schema — every field is a string, because inputs produce strings.
 *    Feeds `form.Field` validators via `schema.shape.<key>`.
 * B. Server schema — real types, re-validated INSIDE the action. The client
 *    pass only guards the UI; anyone can post straight at the action.
 *
 * The minimums below mirror `auth.validation.ts` on the backend. If they drift,
 * the user gets a green field and then a server rejection, which reads as a bug.
 */

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/* --------------------------------- login -------------------------------- */

export const loginFormZodSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string("Password is required").min(1, "Password is required"),
});

export type ILoginFormValues = z.infer<typeof loginFormZodSchema>;

export const loginServerZodSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
}) satisfies z.ZodType<ILoginPayload>;

/* ------------------------------- register ------------------------------- */

export const registerFormZodSchema = z
  .object({
    agencyName: z
      .string("Agency name is required")
      .min(2, "Agency name must be at least 2 characters"),
    agencyPhone: z.string().optional(),
    name: z.string("Your name is required").min(2, "Name must be at least 2 characters"),
    email: z.email("Enter a valid email address"),
    password: z.string("Password is required").min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string("Confirm your password").min(1, "Confirm your password"),
  })
  // Cross-field, so it cannot attach to a single `form.Field` validator — the
  // form checks it in onSubmit and surfaces it as a toast.
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * `.refine` produces a ZodEffects, which has no `.shape`. The per-field
 * validators need the plain object, so it is exported separately rather than
 * reaching through internals.
 */
export const registerFieldsZodSchema = z.object({
  agencyName: z.string("Agency name is required").min(2, "Agency name must be at least 2 characters"),
  agencyPhone: z.string().optional(),
  name: z.string("Your name is required").min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email address"),
  password: z.string("Password is required").min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string("Confirm your password").min(1, "Confirm your password"),
});

export type IRegisterFormValues = z.infer<typeof registerFieldsZodSchema>;

/// confirmPassword is a UI concern and is deliberately not sent to the API.
export const registerServerZodSchema = z.object({
  agencyName: z.string().min(2, "Agency name must be at least 2 characters"),
  agencyPhone: z.preprocess(emptyStringToUndefined, z.string().optional()),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
}) satisfies z.ZodType<IRegisterPayload>;

/* --------------------------- change password ---------------------------- */

export const changePasswordFieldsZodSchema = z.object({
  currentPassword: z.string("Current password is required").min(1, "Current password is required"),
  newPassword: z
    .string("New password is required")
    .min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string("Confirm your new password").min(1, "Confirm your new password"),
});

export type IChangePasswordFormValues = z.infer<typeof changePasswordFieldsZodSchema>;

export const changePasswordFormZodSchema = changePasswordFieldsZodSchema
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    message: "The new password must be different from the current one",
    path: ["newPassword"],
  });

export const changePasswordServerZodSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
}) satisfies z.ZodType<IChangePasswordPayload>;

/* --------------------------- password recovery --------------------------- */

export const forgotPasswordFormZodSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export type IForgotPasswordFormValues = z.infer<typeof forgotPasswordFormZodSchema>;

export const forgotPasswordServerZodSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
}) satisfies z.ZodType<IForgotPasswordPayload>;

export const resetPasswordFieldsZodSchema = z.object({
  newPassword: z
    .string("New password is required")
    .min(8, "New password must be at least 8 characters")
    .max(128, "New password must be at most 128 characters"),
  confirmPassword: z.string("Confirm your new password").min(1, "Confirm your new password"),
});

export type IResetPasswordFormValues = z.infer<typeof resetPasswordFieldsZodSchema>;

export const resetPasswordFormZodSchema = resetPasswordFieldsZodSchema.refine(
  (values) => values.newPassword === values.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] },
);

export const resetPasswordServerZodSchema = z.object({
  token: z.string("This reset link is incomplete").min(10, "This reset link is incomplete").max(200),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
}) satisfies z.ZodType<IResetPasswordPayload>;
