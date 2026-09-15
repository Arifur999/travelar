import { z } from "@/lib/zod";
import { type ICreatePlanPayload } from "@/types/admin.types";

const FEATURES = ["TICKETING", "VISA", "HAJJ_UMRAH", "EXPENSE", "REPORTS", "CRM"] as const;

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const planFieldsZodSchema = z.object({
  name: z.string("Plan name is required").min(2, "Name is too short"),
  description: z.string().max(1000, "Description must be 1000 characters or fewer").optional(),
  // Zero is allowed — a free tier is a plan like any other.
  price: z.string("Price is required").regex(/^\d*(\.\d{1,2})?$/, "Price must be a number"),
  durationDays: z
    .string("Duration is required")
    .regex(/^\d+$/, "Duration must be a whole number")
    .refine((value) => Number(value) > 0, "Duration must be at least 1 day"),
  isActive: z.boolean(),
});

export type IPlanFormValues = z.infer<typeof planFieldsZodSchema> & {
  features: string[];
};

export const createPlanServerZodSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  description: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
  price: z.coerce.number("Price is required").nonnegative("Price cannot be negative"),
  durationDays: z.coerce
    .number("Duration is required")
    .int()
    .positive("Duration must be at least 1 day"),
  features: z.array(z.enum(FEATURES, "Unknown feature")).optional(),
  isActive: z.boolean().optional(),
}) satisfies z.ZodType<ICreatePlanPayload>;

export const updatePlanServerZodSchema = createPlanServerZodSchema.partial();

/** TRIAL is absent on purpose: an agency cannot be put back on trial by hand. */
export const updateAgencyStatusServerZodSchema = z.object({
  status: z.enum(["ACTIVE", "EXPIRED", "SUSPENDED"], "Invalid status"),
});

export const assignPlanServerZodSchema = z.object({
  planId: z.uuid("A valid plan is required"),
});

export const extendTrialServerZodSchema = z.object({
  days: z.coerce
    .number("Days is required")
    .int()
    .positive("Days must be greater than zero")
    .max(365, "At most 365 days"),
});
