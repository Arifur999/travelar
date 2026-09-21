import { PAYMENT_SOURCES } from "@/lib/paymentSource";
import { z } from "@/lib/zod";
import {
  type IChangeTourBookingStatusPayload,
  type ICreateTourBookingPayload,
  type ICreateTourPackagePayload,
  type IRecordTourPaymentPayload,
  type IUpdateTourBookingPayload,
  type IUpdateTourPackagePayload,
} from "@/types/tour.types";

const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "MOBILE_BANKING", "CHEQUE", "OTHER"] as const;
const TOUR_STATUSES = ["OPEN", "CLOSED", "COMPLETED", "CANCELLED"] as const;

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const moneyString = (label: string) =>
  z.string(`${label} is required`).regex(/^\d*(\.\d{1,2})?$/, `${label} must be a number`);

/* --------------------------------- tours --------------------------------- */

export const tourFieldsZodSchema = z.object({
  name: z.string("Tour name is required").min(3, "Name is too short"),
  destination: z.string("Destination is required").min(2, "Destination is too short"),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  durationDays: z.string().regex(/^\d*$/, "Duration must be a whole number of days").optional(),
  // Blank means no fixed limit, which is different from a capacity of zero.
  seatCapacity: z.string().regex(/^\d*$/, "Seats must be a whole number").optional(),
  pricePerPerson: moneyString("Price per person").refine(
    (value) => Number(value) > 0,
    "Price must be greater than zero",
  ),
  costPerPerson: moneyString("Cost per person").optional(),
  inclusions: z.string().max(2000, "Inclusions must be 2000 characters or fewer").optional(),
  description: z.string().max(2000, "Description must be 2000 characters or fewer").optional(),
  status: z.enum(TOUR_STATUSES),
});

export type ITourFormValues = z.infer<typeof tourFieldsZodSchema>;

const tourPayloadShape = {
  name: z.string().min(3, "Name is too short"),
  destination: z.string().min(2, "Destination is too short"),
  departureDate: z.preprocess(emptyStringToUndefined, z.string().optional()),
  returnDate: z.preprocess(emptyStringToUndefined, z.string().optional()),
  durationDays: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive("Duration must be at least a day").optional(),
  ),
  seatCapacity: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive("Capacity must be at least 1").optional(),
  ),
  pricePerPerson: z.coerce
    .number("Price per person is required")
    .positive("Price must be greater than zero"),
  costPerPerson: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Cost cannot be negative").optional(),
  ),
  inclusions: z.preprocess(emptyStringToUndefined, z.string().max(2000).optional()),
  description: z.preprocess(emptyStringToUndefined, z.string().max(2000).optional()),
};

export const createTourServerZodSchema = z.object(
  tourPayloadShape,
) satisfies z.ZodType<ICreateTourPackagePayload>;

/// Status only travels on an update: a new tour always opens.
export const updateTourServerZodSchema = z
  .object(tourPayloadShape)
  .partial()
  .extend({
    status: z.enum(TOUR_STATUSES, "Invalid tour status").optional(),
  }) satisfies z.ZodType<IUpdateTourPackagePayload>;

/* -------------------------------- bookings ------------------------------- */

export const tourBookingFieldsZodSchema = z.object({
  customerId: z.string("Pick a customer").min(1, "Pick a customer"),
  packageId: z.string("Pick a tour").min(1, "Pick a tour"),
  leadTraveller: z.string("Lead traveller is required").min(2, "Name is too short"),
  travellers: z.string().regex(/^\d*$/, "Travellers must be a whole number").optional(),
  // Blank means "use the tour rate times the seats", which the API snapshots.
  sellAmount: moneyString("Price").optional(),
  costAmount: moneyString("Cost").optional(),
  note: z.string().max(1000, "Note must be 1000 characters or fewer").optional(),
});

export type ITourBookingFormValues = z.infer<typeof tourBookingFieldsZodSchema>;

export const createTourBookingServerZodSchema = z.object({
  customerId: z.uuid("A valid customer is required"),
  packageId: z.uuid("A valid tour is required"),
  leadTraveller: z.string().min(2, "Name is too short"),
  travellers: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive("At least one traveller").optional(),
  ),
  sellAmount: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Price cannot be negative").optional(),
  ),
  costAmount: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Cost cannot be negative").optional(),
  ),
  note: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
}) satisfies z.ZodType<ICreateTourBookingPayload>;

/// The customer and the tour are absent: a booking cannot change hands, and
/// moving it to another tour would rewrite its seats and price behind the
/// customer's back.
export const updateTourBookingServerZodSchema = z.object({
  leadTraveller: z.preprocess(
    emptyStringToUndefined,
    z.string().min(2, "Name is too short").optional(),
  ),
  travellers: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive("At least one traveller").optional(),
  ),
  sellAmount: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Price cannot be negative").optional(),
  ),
  costAmount: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Cost cannot be negative").optional(),
  ),
  note: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
}) satisfies z.ZodType<IUpdateTourBookingPayload>;

/* --------------------------------- status -------------------------------- */

export const tourStatusFieldsZodSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
  note: z.string().max(1000, "Note must be 1000 characters or fewer").optional(),
});

export type ITourStatusFormValues = z.infer<typeof tourStatusFieldsZodSchema>;

export const changeTourStatusServerZodSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"], "Invalid target status"),
  note: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
}) satisfies z.ZodType<IChangeTourBookingStatusPayload>;

/* -------------------------------- payments ------------------------------- */

export const tourPaymentFieldsZodSchema = z.object({
  source: z.enum(PAYMENT_SOURCES),
  // Only asked for when `source` is ACCOUNT; a wallet payment names none.
  cashAccountId: z.string().optional(),
  amount: moneyString("Amount").refine(
    (value) => Number(value) > 0,
    "Amount must be greater than zero",
  ),
  method: z.enum(METHODS),
  reference: z.string().max(120, "Reference must be 120 characters or fewer").optional(),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
  paidAt: z.string().optional(),
});

export type ITourPaymentFormValues = z.infer<typeof tourPaymentFieldsZodSchema>;

export const tourPaymentServerZodSchema = z
  .object({
    cashAccountId: z.preprocess(
      emptyStringToUndefined,
      z.uuid("A valid account is required").optional(),
    ),
    fromWallet: z.boolean().optional(),
    amount: z.coerce.number("Amount is required").positive("Amount must be greater than zero"),
    method: z.enum(METHODS, "Invalid payment method").optional(),
    reference: z.preprocess(emptyStringToUndefined, z.string().max(120).optional()),
    note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
    paidAt: z.preprocess(emptyStringToUndefined, z.string().optional()),
  })
  // A payment is either money arriving into an account or a balance the
  // customer already paid in. Neither means nothing can be posted, and the
  // API refuses it too — this just says so before the round trip.
  .refine((values) => values.fromWallet === true || Boolean(values.cashAccountId), {
    message: "Choose the account the money went into",
    path: ["cashAccountId"],
  }) satisfies z.ZodType<IRecordTourPaymentPayload>;
