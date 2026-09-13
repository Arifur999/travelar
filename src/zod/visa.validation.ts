import { z } from "zod";
import {
  type IChangeVisaStatusPayload,
  type ICreateVisaAgentPayload,
  type ICreateVisaCasePayload,
  type IRecordVisaPaymentPayload,
} from "@/types/visa.types";

const METHODS = ["CASH", "BANK_TRANSFER", "CARD", "MOBILE_BANKING", "CHEQUE", "OTHER"] as const;

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const feeString = (label: string) =>
  z.string().regex(/^\d*(\.\d{1,2})?$/, `${label} must be a number`).optional();

/* ------------------------------- visa cases ------------------------------ */

export const visaCaseFieldsZodSchema = z.object({
  customerId: z.string("Pick a customer").min(1, "Pick a customer"),
  visaAgentId: z.string().optional(),
  country: z.string("Country is required").min(2, "Country is too short"),
  visaType: z.string("Visa type is required").min(2, "Visa type is too short"),
  applicationNo: z.string().max(80, "Application number must be 80 characters or fewer").optional(),
  submittedAt: z.string().optional(),
  serviceFee: feeString("Service fee"),
  embassyFee: feeString("Embassy fee"),
});

export type IVisaCaseFormValues = z.infer<typeof visaCaseFieldsZodSchema>;

export const createVisaCaseServerZodSchema = z.object({
  customerId: z.uuid("A valid customer is required"),
  visaAgentId: z.preprocess(emptyStringToUndefined, z.uuid("Invalid visa agent").optional()),
  country: z.string().min(2, "Country is too short"),
  visaType: z.string().min(2, "Visa type is too short"),
  applicationNo: z.preprocess(emptyStringToUndefined, z.string().max(80).optional()),
  submittedAt: z.preprocess(emptyStringToUndefined, z.string().optional()),
  serviceFee: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Service fee cannot be negative").optional(),
  ),
  embassyFee: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Embassy fee cannot be negative").optional(),
  ),
}) satisfies z.ZodType<ICreateVisaCasePayload>;

/** customerId is stripped: the API omits it, so a case cannot change hands. */
export const updateVisaCaseServerZodSchema = createVisaCaseServerZodSchema
  .partial()
  .omit({ customerId: true });

/* ---------------------------------- status ------------------------------- */

export const visaStatusFieldsZodSchema = z.object({
  status: z.enum(["PROCESSING", "APPROVED", "REJECTED", "DELIVERED"]),
  note: z.string().max(1000, "Note must be 1000 characters or fewer").optional(),
});

export type IVisaStatusFormValues = z.infer<typeof visaStatusFieldsZodSchema>;

export const changeVisaStatusServerZodSchema = z.object({
  status: z.enum(["PROCESSING", "APPROVED", "REJECTED", "DELIVERED"], "Invalid target status"),
  note: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
}) satisfies z.ZodType<IChangeVisaStatusPayload>;

/* -------------------------------- payments ------------------------------- */

export const visaPaymentFieldsZodSchema = z.object({
  cashAccountId: z.string("Pick an account").min(1, "Pick an account"),
  amount: z
    .string("Amount is required")
    .regex(/^\d*(\.\d{1,2})?$/, "Amount must be a positive number")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  method: z.enum(METHODS),
  reference: z.string().max(120, "Reference must be 120 characters or fewer").optional(),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
  paidAt: z.string().optional(),
});

export type IVisaPaymentFormValues = z.infer<typeof visaPaymentFieldsZodSchema>;

export const visaPaymentServerZodSchema = z.object({
  cashAccountId: z.uuid("A valid account is required"),
  amount: z.coerce.number("Amount is required").positive("Amount must be greater than zero"),
  method: z.enum(METHODS, "Invalid payment method").optional(),
  reference: z.preprocess(emptyStringToUndefined, z.string().max(120).optional()),
  note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
  paidAt: z.preprocess(emptyStringToUndefined, z.string().optional()),
}) satisfies z.ZodType<IRecordVisaPaymentPayload>;

/* --------------------------------- agents -------------------------------- */

export const visaAgentFieldsZodSchema = z.object({
  name: z.string("Agent name is required").min(2, "Name is too short"),
  type: z.string().max(40, "Type must be 40 characters or fewer").optional(),
  contact: z.string().max(80, "Contact must be 80 characters or fewer").optional(),
  email: z.string().optional(),
  address: z.string().max(500, "Address must be 500 characters or fewer").optional(),
  note: z.string().max(1000, "Note must be 1000 characters or fewer").optional(),
});

export type IVisaAgentFormValues = z.infer<typeof visaAgentFieldsZodSchema>;

export const createVisaAgentServerZodSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  type: z.preprocess(emptyStringToUndefined, z.string().max(40).optional()),
  contact: z.preprocess(emptyStringToUndefined, z.string().max(80).optional()),
  // Optional *and* an email when present — a bare z.email() rejects "".
  email: z.preprocess(emptyStringToUndefined, z.email("Invalid email").optional()),
  address: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
  note: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
}) satisfies z.ZodType<ICreateVisaAgentPayload>;

export const updateVisaAgentServerZodSchema = createVisaAgentServerZodSchema.partial();

/* -------------------------------- documents ------------------------------ */

export const visaDocumentServerZodSchema = z.object({
  title: z.string().min(2, "Document name is too short"),
});
