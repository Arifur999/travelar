import { z } from "zod";
import {
  TIME_PATTERN,
  type ICreateAttendancePayload,
  type ICreateEmployeePayload,
  type ICreateEmployeeTransactionPayload,
} from "@/types/employee.types";

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/* -------------------------------- employees ------------------------------ */

export const employeeFieldsZodSchema = z.object({
  name: z.string("Employee name is required").min(2, "Name is too short"),
  phone: z.string("Phone is required").min(6, "Phone is too short"),
  address: z.string().max(500, "Address must be 500 characters or fewer").optional(),
  joinDate: z.string("Join date is required").min(1, "Join date is required"),
  resignDate: z.string().optional(),
});

export type IEmployeeFormValues = z.infer<typeof employeeFieldsZodSchema>;

/**
 * The resign date is the one thing that decides whether someone is active, so
 * the cross-field rule the API enforces is checked here too rather than only
 * being discovered on submit.
 */
export const employeeFormZodSchema = employeeFieldsZodSchema.refine(
  (values) => !values.resignDate || values.resignDate >= values.joinDate,
  { message: "Resign date cannot be before the join date", path: ["resignDate"] },
);

export const createEmployeeServerZodSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  phone: z.string().min(6, "Phone is too short"),
  address: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
  joinDate: z.string().min(1, "Join date is required"),
  // Nullable, not just optional: null is how the API is told to clear a resign
  // date and make the employee active again, so it must survive validation.
  resignDate: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().nullable().optional(),
  ),
}) satisfies z.ZodType<ICreateEmployeePayload>;

export const updateEmployeeServerZodSchema = createEmployeeServerZodSchema.partial();

/* --------------------------------- payouts ------------------------------- */

export const payoutFieldsZodSchema = z.object({
  employeeId: z.string("Pick an employee").min(1, "Pick an employee"),
  cashAccountId: z.string("Pick an account").min(1, "Pick an account"),
  type: z.enum(["SALARY", "BONUS"]),
  amount: z
    .string("Amount is required")
    .regex(/^\d*(\.\d{1,2})?$/, "Amount must be a positive number")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  totalDays: z.string().regex(/^\d*$/, "Days must be a whole number").optional(),
  date: z.string().optional(),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
});

export type IPayoutFormValues = z.infer<typeof payoutFieldsZodSchema>;

export const createPayoutServerZodSchema = z.object({
  employeeId: z.uuid("A valid employee is required"),
  cashAccountId: z.uuid("A valid account is required"),
  type: z.enum(["SALARY", "BONUS"], "Type must be SALARY or BONUS"),
  amount: z.coerce.number("Amount is required").positive("Amount must be greater than zero"),
  totalDays: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().nonnegative("Days cannot be negative").optional(),
  ),
  date: z.preprocess(emptyStringToUndefined, z.string().optional()),
  note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
}) satisfies z.ZodType<ICreateEmployeeTransactionPayload>;

/* ------------------------------- attendance ------------------------------ */

export const attendanceFieldsZodSchema = z.object({
  employeeId: z.string("Pick an employee").min(1, "Pick an employee"),
  date: z.string("Date is required").min(1, "Date is required"),
  status: z.enum(["PRESENT", "ABSENT"]),
  startTime: z.string().regex(TIME_PATTERN, "Time must look like 09:30 AM").optional(),
  endTime: z.string().regex(TIME_PATTERN, "Time must look like 06:00 PM").optional(),
  note: z.string().max(500, "Note must be 500 characters or fewer").optional(),
});

export type IAttendanceFormValues = z.infer<typeof attendanceFieldsZodSchema>;

export const createAttendanceServerZodSchema = z.object({
  employeeId: z.uuid("A valid employee is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["PRESENT", "ABSENT"], "Status must be PRESENT or ABSENT"),
  startTime: z.preprocess(
    emptyStringToUndefined,
    z.string().regex(TIME_PATTERN, "Time must look like 09:30 AM").optional(),
  ),
  endTime: z.preprocess(
    emptyStringToUndefined,
    z.string().regex(TIME_PATTERN, "Time must look like 06:00 PM").optional(),
  ),
  note: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
}) satisfies z.ZodType<ICreateAttendancePayload>;
