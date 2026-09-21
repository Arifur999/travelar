import { PAYMENT_SOURCES } from "@/lib/paymentSource";
import { z } from "@/lib/zod";
import {
  type IChangeHotelBookingStatusPayload,
  type ICreateHotelBookingPayload,
  type IRecordHotelPaymentPayload,
  type IUpdateHotelBookingPayload,
} from "@/types/hotel.types";

const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "MOBILE_BANKING", "CHEQUE", "OTHER"] as const;

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const moneyString = (label: string) =>
  z.string(`${label} is required`).regex(/^\d*(\.\d{1,2})?$/, `${label} must be a number`);

/* -------------------------------- bookings ------------------------------- */

export const hotelBookingFieldsZodSchema = z.object({
  customerId: z.string("Pick a customer").min(1, "Pick a customer"),
  hotelName: z.string("Hotel name is required").min(2, "Hotel name is too short"),
  city: z.string("City is required").min(2, "City is too short"),
  country: z.string().max(80, "Country must be 80 characters or fewer").optional(),
  bookedThrough: z.string().max(160, "Must be 160 characters or fewer").optional(),
  confirmationNo: z.string().max(80, "Must be 80 characters or fewer").optional(),
  guestName: z.string("Guest name is required").min(2, "Guest name is too short"),
  checkIn: z.string("Check-in date is required").min(1, "Check-in date is required"),
  checkOut: z.string("Check-out date is required").min(1, "Check-out date is required"),
  rooms: z.string().regex(/^\d*$/, "Rooms must be a whole number").optional(),
  guests: z.string().regex(/^\d*$/, "Guests must be a whole number").optional(),
  roomType: z.string().max(80, "Room type must be 80 characters or fewer").optional(),
  sellAmount: moneyString("Price"),
  costAmount: moneyString("Cost").optional(),
  note: z.string().max(1000, "Note must be 1000 characters or fewer").optional(),
});

export type IHotelBookingFormValues = z.infer<typeof hotelBookingFieldsZodSchema>;

const bookingPayloadShape = {
  hotelName: z.string().min(2, "Hotel name is too short"),
  city: z.string().min(2, "City is too short"),
  country: z.preprocess(emptyStringToUndefined, z.string().max(80).optional()),
  bookedThrough: z.preprocess(emptyStringToUndefined, z.string().max(160).optional()),
  confirmationNo: z.preprocess(emptyStringToUndefined, z.string().max(80).optional()),
  guestName: z.string().min(2, "Guest name is too short"),
  checkIn: z.string("Check-in date is required").min(1, "Check-in date is required"),
  checkOut: z.string("Check-out date is required").min(1, "Check-out date is required"),
  rooms: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive("At least one room").optional(),
  ),
  guests: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive("At least one guest").optional(),
  ),
  roomType: z.preprocess(emptyStringToUndefined, z.string().max(80).optional()),
  sellAmount: z.coerce.number("Price is required").nonnegative("Price cannot be negative"),
  costAmount: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Cost cannot be negative").optional(),
  ),
  note: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
};

export const createHotelBookingServerZodSchema = z.object({
  customerId: z.uuid("A valid customer is required"),
  ...bookingPayloadShape,
}) satisfies z.ZodType<ICreateHotelBookingPayload>;

/// The customer is absent: a stay cannot change hands.
export const updateHotelBookingServerZodSchema = z
  .object(bookingPayloadShape)
  .partial() satisfies z.ZodType<IUpdateHotelBookingPayload>;

/* --------------------------------- status -------------------------------- */

export const hotelStatusFieldsZodSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
  note: z.string().max(1000, "Note must be 1000 characters or fewer").optional(),
});

export type IHotelStatusFormValues = z.infer<typeof hotelStatusFieldsZodSchema>;

export const changeHotelStatusServerZodSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"], "Invalid target status"),
  note: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
}) satisfies z.ZodType<IChangeHotelBookingStatusPayload>;

/* -------------------------------- payments ------------------------------- */

export const hotelPaymentFieldsZodSchema = z.object({
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

export type IHotelPaymentFormValues = z.infer<typeof hotelPaymentFieldsZodSchema>;

export const hotelPaymentServerZodSchema = z
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
  }) satisfies z.ZodType<IRecordHotelPaymentPayload>;
