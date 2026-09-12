import { z } from "zod";
import {
  type ICreateAirlinePayload,
  type ICreateRoutePayload,
} from "@/types/masterData.types";

/**
 * Bounds mirror `airlineMaster.validation.ts` and `routeMaster.validation.ts`
 * on the backend. If they drift, a field goes green here and is then rejected
 * by the API, which reads as a bug rather than as validation.
 */

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/* -------------------------------- airlines ------------------------------- */

export const createAirlineFormZodSchema = z.object({
  name: z.string("Airline name is required").min(2, "Name must be at least 2 characters"),
  shortCode: z
    .string("Short code is required")
    .min(1, "Short code is required")
    .max(5, "Short code must be 5 characters or fewer"),
  logoUrl: z.string().optional(),
  remark: z.string().max(500, "Remark must be 500 characters or fewer").optional(),
});

export type ICreateAirlineFormValues = z.infer<typeof createAirlineFormZodSchema>;

export const createAirlineServerZodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  // Uppercased here as well as on the backend, so the value the optimistic UI
  // shows matches the value that comes back.
  shortCode: z
    .string()
    .min(1, "Short code is required")
    .max(5, "Short code must be 5 characters or fewer")
    .transform((value) => value.toUpperCase()),
  // Optional *and* a URL when present. Validating a bare `z.url()` would
  // reject an untouched empty field.
  logoUrl: z.preprocess(
    emptyStringToUndefined,
    z.url("Logo must be a valid URL").optional(),
  ),
  remark: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
}) satisfies z.ZodType<ICreateAirlinePayload>;

/* --------------------------------- routes -------------------------------- */

export const createRouteFormZodSchema = z.object({
  name: z.string("Route is required").min(3, "Route must be at least 3 characters"),
  remark: z.string().max(500, "Remark must be 500 characters or fewer").optional(),
});

export type ICreateRouteFormValues = z.infer<typeof createRouteFormZodSchema>;

export const createRouteServerZodSchema = z.object({
  name: z.string().min(3, "Route must be at least 3 characters"),
  remark: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
}) satisfies z.ZodType<ICreateRoutePayload>;
