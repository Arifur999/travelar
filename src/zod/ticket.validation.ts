import { z } from "zod";
import {
  type IChangeTicketStatusPayload,
  type ICreateTicketPayload,
  type IDateChangePayload,
  type IRecordTicketPaymentPayload,
} from "@/types/ticket.types";

const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "MOBILE_BANKING", "CHEQUE", "OTHER"] as const;

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/** Non-negative money as a form string. Zero is allowed — a free ticket exists. */
const moneyString = (label: string) =>
  z.string(`${label} is required`).regex(/^\d*(\.\d{1,2})?$/, `${label} must be a number`);

/* --------------------------------- ticket -------------------------------- */

export const createTicketFormZodSchema = z.object({
  customerId: z.string("Pick a customer").min(1, "Pick a customer"),
  supplierId: z.string().optional(),
  airlineId: z.string().optional(),
  routeId: z.string().optional(),
  passengerName: z.string("Passenger name is required").min(2, "Passenger name is too short"),
  pnr: z.string("PNR is required").min(3, "PNR must be at least 3 characters"),
  travelDate: z.string().optional(),
  issueDate: z.string().optional(),
  fare: moneyString("Fare").refine((value) => value !== "", "Fare is required"),
  cost: moneyString("Cost").refine((value) => value !== "", "Cost is required"),
});

export type ICreateTicketFormValues = z.infer<typeof createTicketFormZodSchema>;

export const createTicketServerZodSchema = z.object({
  customerId: z.uuid("A valid customer is required"),
  // Optional relations: an empty select must become undefined, not "" — the
  // API validates these as uuids and would reject an empty string.
  supplierId: z.preprocess(emptyStringToUndefined, z.uuid("Invalid supplier").optional()),
  airlineId: z.preprocess(emptyStringToUndefined, z.uuid("Invalid airline").optional()),
  routeId: z.preprocess(emptyStringToUndefined, z.uuid("Invalid route").optional()),
  passengerName: z.string().min(2, "Passenger name is too short"),
  pnr: z.string().min(3, "PNR must be at least 3 characters"),
  travelDate: z.preprocess(emptyStringToUndefined, z.string().optional()),
  issueDate: z.preprocess(emptyStringToUndefined, z.string().optional()),
  fare: z.coerce.number("Fare is required").nonnegative("Fare cannot be negative"),
  cost: z.coerce.number("Cost is required").nonnegative("Cost cannot be negative"),
}) satisfies z.ZodType<ICreateTicketPayload>;

export const updateTicketServerZodSchema = createTicketServerZodSchema.partial();

/* ------------------------------- date change ----------------------------- */

export const dateChangeFieldsZodSchema = z.object({
  dateChangedAt: z.string().optional(),
  travelDate: z.string().optional(),
  dateChangeCost: z
    .string()
    .regex(/^\d*(\.\d{1,2})?$/, "Change cost must be a number")
    .optional(),
  dateChangeFee: z
    .string()
    .regex(/^\d*(\.\d{1,2})?$/, "Change fee must be a number")
    .optional(),
});

export type IDateChangeFormValues = z.infer<typeof dateChangeFieldsZodSchema>;

export const dateChangeServerZodSchema = z.object({
  dateChangedAt: z.preprocess(emptyStringToUndefined, z.string().optional()),
  travelDate: z.preprocess(emptyStringToUndefined, z.string().optional()),
  dateChangeCost: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Change cost cannot be negative").optional(),
  ),
  dateChangeFee: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Change fee cannot be negative").optional(),
  ),
}) satisfies z.ZodType<IDateChangePayload>;

/* ---------------------------------- status ------------------------------- */

export const changeStatusFieldsZodSchema = z.object({
  status: z.enum(["REISSUED", "REFUNDED", "VOID"], "Pick a status"),
  refundAmount: z
    .string()
    .regex(/^\d*(\.\d{1,2})?$/, "Refund must be a number")
    .optional(),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
});

export type IChangeStatusFormValues = z.infer<typeof changeStatusFieldsZodSchema>;

export const changeStatusServerZodSchema = z.object({
  status: z.enum(["REISSUED", "REFUNDED", "VOID"], "Invalid target status"),
  refundAmount: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Refund cannot be negative").optional(),
  ),
  note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
}) satisfies z.ZodType<IChangeTicketStatusPayload>;

/* --------------------------------- payment ------------------------------- */

export const ticketPaymentFieldsZodSchema = z.object({
  cashAccountId: z.string("Pick an account").min(1, "Pick an account"),
  amount: moneyString("Amount").refine(
    (value) => Number(value) > 0,
    "Amount must be greater than zero",
  ),
  method: z.enum(METHODS),
  reference: z.string().max(120, "Reference must be 120 characters or fewer").optional(),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
  paidAt: z.string().optional(),
});

export type ITicketPaymentFormValues = z.infer<typeof ticketPaymentFieldsZodSchema>;

export const ticketPaymentServerZodSchema = z.object({
  cashAccountId: z.uuid("A valid account is required"),
  amount: z.coerce.number("Amount is required").positive("Amount must be greater than zero"),
  method: z.enum(METHODS, "Invalid payment method").optional(),
  reference: z.preprocess(emptyStringToUndefined, z.string().max(120).optional()),
  note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
  paidAt: z.preprocess(emptyStringToUndefined, z.string().optional()),
}) satisfies z.ZodType<IRecordTicketPaymentPayload>;
