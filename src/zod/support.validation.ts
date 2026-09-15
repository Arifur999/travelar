import { z } from "@/lib/zod";
import {
  type ICreateAnnouncementPayload,
  type ICreateSupportTicketPayload,
} from "@/types/support.types";

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const CATEGORIES = ["BILLING", "TECHNICAL", "FEATURE_REQUEST", "OTHER"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const TYPES = ["INFO", "FEATURE", "MAINTENANCE", "WARNING"] as const;

/* --------------------------------- tickets ------------------------------- */

export const supportTicketFieldsZodSchema = z.object({
  subject: z.string("Subject is required").min(4, "Subject is too short"),
  message: z.string("Message is required").min(4, "Message is too short"),
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
});

export type ISupportTicketFormValues = z.infer<typeof supportTicketFieldsZodSchema>;

export const createSupportTicketServerZodSchema = z.object({
  subject: z.string().min(4, "Subject is too short"),
  message: z.string().min(4, "Message is too short"),
  category: z.enum(CATEGORIES, "Invalid category").optional(),
  priority: z.enum(PRIORITIES, "Invalid priority").optional(),
}) satisfies z.ZodType<ICreateSupportTicketPayload>;

export const addMessageServerZodSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

export const updateTicketStatusServerZodSchema = z.object({
  status: z.enum(STATUSES, "Invalid status"),
});

/* ------------------------------ announcements ---------------------------- */

export const announcementFieldsZodSchema = z.object({
  title: z.string("Title is required").min(3, "Title is too short"),
  message: z.string("Message is required").min(3, "Message is too short"),
  type: z.enum(TYPES),
});

export type IAnnouncementFormValues = z.infer<typeof announcementFieldsZodSchema>;

export const createAnnouncementServerZodSchema = z.object({
  title: z.string().min(3, "Title is too short"),
  message: z.string().min(3, "Message is too short"),
  type: z.enum(TYPES, "Invalid type").optional(),
}) satisfies z.ZodType<ICreateAnnouncementPayload>;

export const updateAnnouncementServerZodSchema = z.object({
  title: z.preprocess(emptyStringToUndefined, z.string().min(3).optional()),
  message: z.preprocess(emptyStringToUndefined, z.string().min(3).optional()),
  type: z.enum(TYPES, "Invalid type").optional(),
  isActive: z.boolean().optional(),
});
