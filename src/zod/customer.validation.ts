import { z } from "zod";
import {
  type ICreateCustomerPayload,
  type ICreateDueReceivedPayload,
} from "@/types/customer.types";

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/* -------------------------------- customers ------------------------------ */

export const createCustomerFormZodSchema = z.object({
  name: z.string("Customer name is required").min(2, "Name must be at least 2 characters"),
  phone: z.string("Phone is required").min(6, "Phone must be at least 6 characters"),
  email: z.string().optional(),
  passportNo: z.string().max(40, "Passport number must be 40 characters or fewer").optional(),
  address: z.string().max(500, "Address must be 500 characters or fewer").optional(),
  note: z.string().max(1000, "Note must be 1000 characters or fewer").optional(),
  // Signed: negative means the customer is already in credit with you.
  openingDue: z
    .string()
    .regex(/^-?\d*(\.\d{1,2})?$/, "Opening due must be a number")
    .optional(),
});

export type ICreateCustomerFormValues = z.infer<typeof createCustomerFormZodSchema>;

export const createCustomerServerZodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(6, "Phone must be at least 6 characters"),
  // Optional *and* an email when present — a bare z.email() would reject an
  // untouched empty field.
  email: z.preprocess(emptyStringToUndefined, z.email("Invalid email").optional()),
  passportNo: z.preprocess(emptyStringToUndefined, z.string().max(40).optional()),
  address: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
  note: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
  openingDue: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number("Opening due must be a number").optional(),
  ),
}) satisfies z.ZodType<ICreateCustomerPayload>;

export const updateCustomerServerZodSchema = createCustomerServerZodSchema.partial();

/* ------------------------------- collections ----------------------------- */

const positiveAmount = (label: string) =>
  z
    .string(`${label} is required`)
    .regex(/^\d*(\.\d{1,2})?$/, `${label} must be a positive number`);

export const dueReceiptFieldsZodSchema = z.object({
  customerId: z.string("Pick a customer").min(1, "Pick a customer"),
  cashAccount1Id: z.string("Pick an account").min(1, "Pick an account"),
  amount1: positiveAmount("Amount").refine(
    (value) => Number(value) > 0,
    "Amount must be greater than zero",
  ),
  // Split tender: a customer can settle partly in cash and partly by bank.
  cashAccount2Id: z.string().optional(),
  amount2: z
    .string()
    .regex(/^\d*(\.\d{1,2})?$/, "Second amount must be a number")
    .optional(),
  discount: z
    .string()
    .regex(/^\d*(\.\d{1,2})?$/, "Discount must be a number")
    .optional(),
  discountCategory: z.string().max(120, "Category must be 120 characters or fewer").optional(),
  date: z.string().optional(),
  notes: z.string().max(1000, "Notes must be 1000 characters or fewer").optional(),
});

export type ICreateDueReceiptFormValues = z.infer<typeof dueReceiptFieldsZodSchema>;

/**
 * The two cross-field rules the API also enforces. They span fields, so they
 * cannot hang off a single `form.Field` validator and are checked in onSubmit.
 */
export const createDueReceiptFormZodSchema = dueReceiptFieldsZodSchema
  .refine(
    (values) =>
      !values.cashAccount2Id || values.cashAccount2Id !== values.cashAccount1Id,
    { message: "The two accounts must be different", path: ["cashAccount2Id"] },
  )
  .refine(
    (values) => !values.cashAccount2Id || Number(values.amount2 || 0) > 0,
    { message: "A second account needs a second amount", path: ["amount2"] },
  )
  .refine(
    (values) => !(Number(values.amount2 || 0) > 0) || Boolean(values.cashAccount2Id),
    { message: "A second amount needs a second account", path: ["cashAccount2Id"] },
  );

export const createDueReceiptServerZodSchema = z.object({
  customerId: z.uuid("A valid customer is required"),
  cashAccount1Id: z.uuid("A valid account is required"),
  amount1: z.coerce.number("Amount is required").positive("Amount must be greater than zero"),
  cashAccount2Id: z.preprocess(emptyStringToUndefined, z.uuid("Invalid second account").optional()),
  amount2: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Second amount cannot be negative").optional(),
  ),
  discount: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Discount cannot be negative").optional(),
  ),
  discountCategory: z.preprocess(emptyStringToUndefined, z.string().max(120).optional()),
  date: z.preprocess(emptyStringToUndefined, z.string().optional()),
  notes: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
}) satisfies z.ZodType<ICreateDueReceivedPayload>;

export const updateDueReceiptServerZodSchema = z.object({
  date: z.preprocess(emptyStringToUndefined, z.string().optional()),
  discount: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Discount cannot be negative").optional(),
  ),
  discountCategory: z.preprocess(emptyStringToUndefined, z.string().max(120).optional()),
  notes: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
});
