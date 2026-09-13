import { z } from "zod";
import { type IUpsertGoalPayload } from "@/types/dashboard.types";

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const goalFieldsZodSchema = z.object({
  year: z.string().regex(/^\d{4}$/, "Year must be four digits"),
  month: z.string().regex(/^(1[0-2]|[1-9])$/, "Month must be 1-12"),
  salesGoal: z
    .string()
    .regex(/^\d*(\.\d{1,2})?$/, "Goal must be a number")
    .optional(),
  profitGoal: z
    .string()
    .regex(/^\d*(\.\d{1,2})?$/, "Goal must be a number")
    .optional(),
});

export type IGoalFormValues = z.infer<typeof goalFieldsZodSchema>;

export const upsertGoalServerZodSchema = z.object({
  year: z.coerce.number("Year is required").int().min(2000).max(2100),
  month: z.coerce
    .number("Month is required")
    .int()
    .min(1, "Month must be 1-12")
    .max(12, "Month must be 1-12"),
  // Omitted leaves the existing value alone on an update, and defaults to 0 on
  // a create — the API upsert treats undefined and 0 differently, so an empty
  // field must not become 0.
  salesGoal: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Goal cannot be negative").optional(),
  ),
  profitGoal: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Goal cannot be negative").optional(),
  ),
}) satisfies z.ZodType<IUpsertGoalPayload>;
