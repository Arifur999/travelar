import { z } from "zod";
import {
  type IChangeHajjBookingStatusPayload,
  type ICreateHajjBatchPayload,
  type ICreateHajjBookingPayload,
  type ICreateHajjPackagePayload,
  type ICreateHajjRoomPayload,
  type IRecordHajjPaymentPayload,
} from "@/types/hajj.types";

const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "MOBILE_BANKING", "CHEQUE", "OTHER"] as const;
const TYPES = ["HAJJ", "UMRAH"] as const;
const TIERS = ["ECONOMY", "PREMIUM", "VIP"] as const;
const MEALS = ["NONE", "BREAKFAST", "FULL_BOARD"] as const;
const HOTELS = ["MAKKAH", "MADINAH"] as const;
const BATCH_STATUSES = ["OPEN", "FULL", "DEPARTED", "COMPLETED", "CANCELLED"] as const;

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const positiveMoney = z
  .string("Price is required")
  .regex(/^\d*(\.\d{1,2})?$/, "Price must be a number")
  .refine((value) => Number(value) > 0, "Price must be greater than zero");

/* -------------------------------- packages ------------------------------- */

export const hajjPackageFieldsZodSchema = z.object({
  name: z.string("Package name is required").min(3, "Name is too short"),
  type: z.enum(TYPES),
  tier: z.enum(TIERS),
  price: positiveMoney,
  durationDays: z
    .string()
    .regex(/^\d*$/, "Duration must be a whole number of days")
    .optional(),
  makkahHotel: z.string().max(160, "Hotel must be 160 characters or fewer").optional(),
  makkahDistance: z.string().max(80, "Distance must be 80 characters or fewer").optional(),
  madinahHotel: z.string().max(160, "Hotel must be 160 characters or fewer").optional(),
  madinahDistance: z.string().max(80, "Distance must be 80 characters or fewer").optional(),
  muallim: z.string().max(160, "Muallim must be 160 characters or fewer").optional(),
  mealPlan: z.enum(MEALS),
  description: z.string().max(2000, "Description must be 2000 characters or fewer").optional(),
  isActive: z.boolean(),
});

export type IHajjPackageFormValues = z.infer<typeof hajjPackageFieldsZodSchema>;

export const createHajjPackageServerZodSchema = z.object({
  name: z.string().min(3, "Name is too short"),
  type: z.enum(TYPES, "Type must be HAJJ or UMRAH"),
  tier: z.enum(TIERS, "Invalid tier").optional(),
  price: z.coerce.number("Price is required").positive("Price must be greater than zero"),
  durationDays: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().optional(),
  ),
  makkahHotel: z.preprocess(emptyStringToUndefined, z.string().max(160).optional()),
  makkahDistance: z.preprocess(emptyStringToUndefined, z.string().max(80).optional()),
  madinahHotel: z.preprocess(emptyStringToUndefined, z.string().max(160).optional()),
  madinahDistance: z.preprocess(emptyStringToUndefined, z.string().max(80).optional()),
  muallim: z.preprocess(emptyStringToUndefined, z.string().max(160).optional()),
  mealPlan: z.enum(MEALS, "Invalid meal plan").optional(),
  description: z.preprocess(emptyStringToUndefined, z.string().max(2000).optional()),
  isActive: z.boolean().optional(),
}) satisfies z.ZodType<ICreateHajjPackagePayload>;

export const updateHajjPackageServerZodSchema = createHajjPackageServerZodSchema.partial();

/* -------------------------------- batches -------------------------------- */

export const hajjBatchFieldsZodSchema = z.object({
  packageId: z.string("Pick a package").min(1, "Pick a package"),
  name: z.string("Batch name is required").min(2, "Name is too short"),
  departureDate: z.string("Departure date is required").min(1, "Departure date is required"),
  returnDate: z.string().optional(),
  seatCapacity: z
    .string("Seat capacity is required")
    .regex(/^\d+$/, "Capacity must be a whole number")
    .refine((value) => Number(value) > 0, "Capacity must be at least 1"),
});

export type IHajjBatchFormValues = z.infer<typeof hajjBatchFieldsZodSchema>;

export const createHajjBatchServerZodSchema = z.object({
  packageId: z.uuid("A valid package is required"),
  name: z.string().min(2, "Name is too short"),
  departureDate: z.string().min(1, "Departure date is required"),
  returnDate: z.preprocess(emptyStringToUndefined, z.string().optional()),
  seatCapacity: z.coerce
    .number("Seat capacity is required")
    .int()
    .positive("Capacity must be at least 1"),
}) satisfies z.ZodType<ICreateHajjBatchPayload>;

export const updateHajjBatchServerZodSchema = createHajjBatchServerZodSchema.partial().extend({
  status: z.enum(BATCH_STATUSES, "Invalid batch status").optional(),
});

/* --------------------------------- rooms --------------------------------- */

export const hajjRoomFieldsZodSchema = z.object({
  batchId: z.string().min(1, "Pick a batch"),
  hotelType: z.enum(HOTELS),
  roomNumber: z.string("Room number is required").min(1, "Room number is required"),
  capacity: z
    .string("Capacity is required")
    .regex(/^\d+$/, "Capacity must be a whole number")
    .refine((value) => Number(value) > 0, "Capacity must be at least 1"),
});

export type IHajjRoomFormValues = z.infer<typeof hajjRoomFieldsZodSchema>;

export const createHajjRoomServerZodSchema = z.object({
  batchId: z.uuid("A valid batch is required"),
  hotelType: z.enum(HOTELS, "Hotel must be MAKKAH or MADINAH"),
  roomNumber: z.string().min(1, "Room number is required"),
  capacity: z.coerce.number("Capacity is required").int().positive("Capacity must be at least 1"),
}) satisfies z.ZodType<ICreateHajjRoomPayload>;

/* -------------------------------- bookings ------------------------------- */

export const hajjBookingFieldsZodSchema = z.object({
  customerId: z.string("Pick a customer").min(1, "Pick a customer"),
  packageId: z.string("Pick a package").min(1, "Pick a package"),
  batchId: z.string("Pick a batch").min(1, "Pick a batch"),
  pilgrimName: z.string("Pilgrim name is required").min(2, "Name is too short"),
  passportNumber: z.string().max(40, "Passport must be 40 characters or fewer").optional(),
  munajjimNumber: z.string().max(40, "Munajjim number must be 40 characters or fewer").optional(),
  packagePrice: z
    .string()
    .regex(/^\d*(\.\d{1,2})?$/, "Price must be a number")
    .optional(),
});

export type IHajjBookingFormValues = z.infer<typeof hajjBookingFieldsZodSchema>;

export const createHajjBookingServerZodSchema = z.object({
  customerId: z.uuid("A valid customer is required"),
  packageId: z.uuid("A valid package is required"),
  batchId: z.uuid("A valid batch is required"),
  pilgrimName: z.string().min(2, "Name is too short"),
  passportNumber: z.preprocess(emptyStringToUndefined, z.string().max(40).optional()),
  munajjimNumber: z.preprocess(emptyStringToUndefined, z.string().max(40).optional()),
  // Omitted means "use the package price", which the API then snapshots.
  packagePrice: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Price cannot be negative").optional(),
  ),
}) satisfies z.ZodType<ICreateHajjBookingPayload>;

/* ---------------------------- status and rooms --------------------------- */

export const hajjStatusFieldsZodSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
  note: z.string().max(1000, "Note must be 1000 characters or fewer").optional(),
});

export type IHajjStatusFormValues = z.infer<typeof hajjStatusFieldsZodSchema>;

export const changeHajjStatusServerZodSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"], "Invalid target status"),
  note: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
}) satisfies z.ZodType<IChangeHajjBookingStatusPayload>;

export const assignRoomServerZodSchema = z.object({
  hotelType: z.enum(HOTELS, "Hotel must be MAKKAH or MADINAH"),
  // Explicitly nullable: null is the documented way to clear an assignment,
  // and must survive validation rather than being stripped as "empty".
  roomId: z.uuid("Invalid room").nullable().optional(),
});

/* -------------------------------- payments ------------------------------- */

export const hajjPaymentFieldsZodSchema = z.object({
  cashAccountId: z.string("Pick an account").min(1, "Pick an account"),
  amount: z
    .string("Amount is required")
    .regex(/^\d*(\.\d{1,2})?$/, "Amount must be a positive number")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  method: z.enum(METHODS),
  transactionRef: z.string().max(120, "Reference must be 120 characters or fewer").optional(),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
  paidAt: z.string().optional(),
});

export type IHajjPaymentFormValues = z.infer<typeof hajjPaymentFieldsZodSchema>;

export const hajjPaymentServerZodSchema = z.object({
  cashAccountId: z.uuid("A valid account is required"),
  amount: z.coerce.number("Amount is required").positive("Amount must be greater than zero"),
  method: z.enum(METHODS, "Invalid payment method").optional(),
  transactionRef: z.preprocess(emptyStringToUndefined, z.string().max(120).optional()),
  note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
  paidAt: z.preprocess(emptyStringToUndefined, z.string().optional()),
}) satisfies z.ZodType<IRecordHajjPaymentPayload>;
