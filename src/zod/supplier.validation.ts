import { z } from "zod";
import {
  type ICreateSupplierPayload,
  type ICreateSupplierTransactionPayload,
} from "@/types/supplier.types";

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/* -------------------------------- suppliers ------------------------------ */

export const createSupplierFormZodSchema = z.object({
  name: z.string("Supplier name is required").min(2, "Supplier name must be at least 2 characters"),
  contactName: z.string().max(120, "Contact name must be 120 characters or fewer").optional(),
  phone: z.string().max(40, "Phone must be 40 characters or fewer").optional(),
  address: z.string().max(500, "Address must be 500 characters or fewer").optional(),
  // Signed: a negative opening payable is an advance already sitting with the
  // supplier, which is a real situation when migrating from another system.
  openingPayable: z
    .string()
    .regex(/^-?\d*(\.\d{1,2})?$/, "Opening payable must be a number")
    .optional(),
});

export type ICreateSupplierFormValues = z.infer<typeof createSupplierFormZodSchema>;

export const createSupplierServerZodSchema = z.object({
  name: z.string().min(2, "Supplier name must be at least 2 characters"),
  contactName: z.preprocess(emptyStringToUndefined, z.string().max(120).optional()),
  phone: z.preprocess(emptyStringToUndefined, z.string().max(40).optional()),
  address: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
  openingPayable: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number("Opening payable must be a number").optional(),
  ),
}) satisfies z.ZodType<ICreateSupplierPayload>;

/**
 * Unlike a cash account's opening balance, `openingPayable` IS editable here —
 * the API allows it. It is a plain column that the payable formula reads, not a
 * posting, so changing it re-derives the figure rather than rewriting history.
 */
export const updateSupplierServerZodSchema = createSupplierServerZodSchema.partial();

/* --------------------------- supplier payments --------------------------- */

export const supplierPaymentFieldsZodSchema = z.object({
  supplierId: z.string("Pick a supplier").min(1, "Pick a supplier"),
  cashAccountId: z.string("Pick the account the money leaves").min(1, "Pick an account"),
  amount: z
    .string("Amount is required")
    .regex(/^\d*(\.\d{1,2})?$/, "Amount must be a positive number")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  date: z.string().optional(),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
});

export type ICreateSupplierPaymentFormValues = z.infer<typeof supplierPaymentFieldsZodSchema>;

export const createSupplierPaymentServerZodSchema = z.object({
  supplierId: z.uuid("A valid supplier is required"),
  cashAccountId: z.uuid("A valid account is required"),
  amount: z.coerce.number("Amount is required").positive("Amount must be greater than zero"),
  date: z.preprocess(emptyStringToUndefined, z.string().optional()),
  note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
}) satisfies z.ZodType<ICreateSupplierTransactionPayload>;

export const updateSupplierPaymentServerZodSchema = z.object({
  date: z.preprocess(emptyStringToUndefined, z.string().optional()),
  note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
});
