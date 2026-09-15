import { z } from "@/lib/zod";
import {
  type ICreateBalanceTransferPayload,
  type ICreateCashAccountPayload,
} from "@/types/account.types";

const CATEGORIES = ["OWNER_FUNDS", "LOANS", "SALES_BUYING", "OTHERS"] as const;

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/* ----------------------------- cash accounts ----------------------------- */

export const createCashAccountFormZodSchema = z.object({
  name: z.string("Account name is required").min(2, "Account name must be at least 2 characters"),
  category: z.enum(CATEGORIES),
  // A string, like every form field. Allowed to be negative: an account can
  // legitimately start overdrawn (a loan account, a card with a balance owed).
  openingBalance: z
    .string()
    .regex(/^-?\d*(\.\d{1,2})?$/, "Opening balance must be a number")
    .optional(),
  isActive: z.boolean(),
});

export type ICreateCashAccountFormValues = z.infer<typeof createCashAccountFormZodSchema>;

export const createCashAccountServerZodSchema = z.object({
  name: z.string().min(2, "Account name must be at least 2 characters"),
  category: z.enum(CATEGORIES).optional(),
  openingBalance: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number("Opening balance must be a number").optional(),
  ),
  isActive: z.boolean().optional(),
}) satisfies z.ZodType<ICreateCashAccountPayload>;

/**
 * `openingBalance` is absent on purpose, matching the API: it wrote an OPENING
 * posting when the account was created, so editing it later would rewrite the
 * ledger behind everyone's back. Correcting an opening balance means an
 * adjustment posting, not an edit.
 */
export const updateCashAccountServerZodSchema = z.object({
  name: z.string().min(2, "Account name must be at least 2 characters").optional(),
  category: z.enum(CATEGORIES).optional(),
  isActive: z.boolean().optional(),
});

/* --------------------------- balance transfers --------------------------- */

export const createBalanceTransferFormZodSchema = z
  .object({
    fromAccountId: z.string("Pick the account the money leaves").min(1, "Pick a source account"),
    toAccountId: z.string("Pick the account the money arrives in").min(1, "Pick a destination account"),
    amount: z
      .string("Amount is required")
      .regex(/^\d*(\.\d{1,2})?$/, "Amount must be a positive number")
      .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
    date: z.string().optional(),
    note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
  })
  .refine((values) => values.fromAccountId !== values.toAccountId, {
    message: "Source and destination account cannot be the same",
    path: ["toAccountId"],
  });

/** The plain object, for per-field validators — `.refine` leaves no `.shape`. */
export const balanceTransferFieldsZodSchema = z.object({
  fromAccountId: z.string("Pick the account the money leaves").min(1, "Pick a source account"),
  toAccountId: z.string("Pick the account the money arrives in").min(1, "Pick a destination account"),
  amount: z
    .string("Amount is required")
    .regex(/^\d*(\.\d{1,2})?$/, "Amount must be a positive number")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  date: z.string().optional(),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
});

export type ICreateBalanceTransferFormValues = z.infer<typeof balanceTransferFieldsZodSchema>;

export const createBalanceTransferServerZodSchema = z
  .object({
    fromAccountId: z.uuid("A valid source account is required"),
    toAccountId: z.uuid("A valid destination account is required"),
    amount: z.coerce.number("Amount is required").positive("Amount must be greater than zero"),
    date: z.preprocess(emptyStringToUndefined, z.string().optional()),
    note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
  })
  .refine((values) => values.fromAccountId !== values.toAccountId, {
    message: "Source and destination account cannot be the same",
    path: ["toAccountId"],
  }) satisfies z.ZodType<ICreateBalanceTransferPayload>;

export const updateBalanceTransferServerZodSchema = z.object({
  date: z.preprocess(emptyStringToUndefined, z.string().optional()),
  note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
});
