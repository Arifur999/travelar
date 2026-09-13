import { z } from "zod";
import {
  type ICreateCapitalFlowPayload,
  type ICreateProfitWithdrawalPayload,
} from "@/types/capital.types";

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const positiveAmount = z
  .string("Amount is required")
  .regex(/^\d*(\.\d{1,2})?$/, "Amount must be a positive number")
  .refine((value) => Number(value) > 0, "Amount must be greater than zero");

/* ------------------------------ capital flows ---------------------------- */

export const capitalFlowFieldsZodSchema = z.object({
  ownerName: z.string("Owner name is required").min(2, "Owner name is too short"),
  type: z.enum(["INVEST", "WITHDRAW"]),
  amount: positiveAmount,
  cashAccountId: z.string("Pick an account").min(1, "Pick an account"),
  date: z.string().optional(),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
});

export type ICapitalFlowFormValues = z.infer<typeof capitalFlowFieldsZodSchema>;

export const createCapitalFlowServerZodSchema = z.object({
  ownerName: z.string().min(2, "Owner name is too short"),
  type: z.enum(["INVEST", "WITHDRAW"], "Type must be INVEST or WITHDRAW"),
  amount: z.coerce.number("Amount is required").positive("Amount must be greater than zero"),
  cashAccountId: z.uuid("A valid account is required"),
  date: z.preprocess(emptyStringToUndefined, z.string().optional()),
  note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
}) satisfies z.ZodType<ICreateCapitalFlowPayload>;

/* --------------------------- profit withdrawals -------------------------- */

export const profitWithdrawalFieldsZodSchema = z.object({
  receivedBy: z.string("Recipient is required").min(2, "Recipient name is too short"),
  amount: positiveAmount,
  cashAccountId: z.string("Pick an account").min(1, "Pick an account"),
  date: z.string().optional(),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
});

export type IProfitWithdrawalFormValues = z.infer<typeof profitWithdrawalFieldsZodSchema>;

export const createProfitWithdrawalServerZodSchema = z.object({
  receivedBy: z.string().min(2, "Recipient name is too short"),
  amount: z.coerce.number("Amount is required").positive("Amount must be greater than zero"),
  cashAccountId: z.uuid("A valid account is required"),
  date: z.preprocess(emptyStringToUndefined, z.string().optional()),
  note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
}) satisfies z.ZodType<ICreateProfitWithdrawalPayload>;

/** Both entities allow only these two fields to change after posting. */
export const updateDateNoteServerZodSchema = z.object({
  date: z.preprocess(emptyStringToUndefined, z.string().optional()),
  note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
});
