import { z } from "zod";
import {
  type ICreateExpenseCategoryPayload,
  type ICreateExpensePayload,
} from "@/types/expense.types";

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const HEX = /^#[0-9a-fA-F]{6}$/;

/* ------------------------------- categories ------------------------------ */

export const createCategoryFormZodSchema = z.object({
  name: z.string("Category name is required").min(2, "Name must be at least 2 characters"),
  color: z.string().regex(HEX, "Colour must be a hex value like #2563eb").optional(),
  monthlyBudget: z
    .string()
    .regex(/^\d*(\.\d{1,2})?$/, "Budget must be a number")
    .optional(),
  yearlyBudget: z
    .string()
    .regex(/^\d*(\.\d{1,2})?$/, "Budget must be a number")
    .optional(),
});

export type ICreateCategoryFormValues = z.infer<typeof createCategoryFormZodSchema>;

export const createCategoryServerZodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  color: z.preprocess(
    emptyStringToUndefined,
    z.string().regex(HEX, "Colour must be a hex value like #2563eb").optional(),
  ),
  monthlyBudget: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Budget cannot be negative").optional(),
  ),
  yearlyBudget: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative("Budget cannot be negative").optional(),
  ),
}) satisfies z.ZodType<ICreateExpenseCategoryPayload>;

export const updateCategoryServerZodSchema = createCategoryServerZodSchema.partial();

/* -------------------------------- expenses ------------------------------- */

export const expenseFieldsZodSchema = z.object({
  categoryId: z.string("Pick a category").min(1, "Pick a category"),
  cashAccountId: z.string("Pick an account").min(1, "Pick an account"),
  amount: z
    .string("Amount is required")
    .regex(/^\d*(\.\d{1,2})?$/, "Amount must be a positive number")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  date: z.string().optional(),
  notes: z.string().max(1000, "Notes must be 1000 characters or fewer").optional(),
});

export type IExpenseFormValues = z.infer<typeof expenseFieldsZodSchema>;

export const createExpenseServerZodSchema = z.object({
  categoryId: z.uuid("A valid category is required"),
  cashAccountId: z.uuid("A valid account is required"),
  amount: z.coerce.number("Amount is required").positive("Amount must be greater than zero"),
  date: z.preprocess(emptyStringToUndefined, z.string().optional()),
  notes: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
}) satisfies z.ZodType<ICreateExpensePayload>;

/** Amount and account are absent: they have already posted to an account. */
export const updateExpenseServerZodSchema = z.object({
  categoryId: z.preprocess(
    emptyStringToUndefined,
    z.uuid("A valid category is required").optional(),
  ),
  date: z.preprocess(emptyStringToUndefined, z.string().optional()),
  notes: z.preprocess(emptyStringToUndefined, z.string().max(1000).optional()),
});
