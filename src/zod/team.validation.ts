import { z } from "@/lib/zod";
import {
  type ICreateTeamMemberPayload,
  type IResetTeamMemberPasswordPayload,
  type IUpdateAgencyProfilePayload,
  type IUpdateMyProfilePayload,
  type IUpdateTeamMemberPayload,
  type IUpdateTeamMemberStatusPayload,
} from "@/types/team.types";

/**
 * Bounds mirror `team.validation.ts`, `agency.validation.ts` and the
 * `updateMeZodSchema` in `auth.validation.ts` on the backend.
 */

const TEAM_ROLES = ["AGENCY_ADMIN", "AGENCY_STAFF"] as const;

/** Blank means "clear it", which the API expects as null rather than "". */
const emptyStringToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

/* ---------------------------------- team --------------------------------- */

export const createTeamMemberFormZodSchema = z.object({
  name: z.string("Name is required").min(2, "Name must be at least 2 characters"),
  email: z.string("Email is required").trim().pipe(z.email("A valid email is required")),
  password: z.string("A temporary password is required").min(8, "At least 8 characters"),
  role: z.enum(TEAM_ROLES),
});

export type ICreateTeamMemberFormValues = z.infer<typeof createTeamMemberFormZodSchema>;

export const createTeamMemberServerZodSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  // Lowercased to match what the API stores, so the row that comes back reads
  // the same as the address that was typed.
  email: z.string().trim().toLowerCase().pipe(z.email("A valid email is required")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(TEAM_ROLES, "Invalid role").optional(),
}) satisfies z.ZodType<ICreateTeamMemberPayload>;

export const updateTeamMemberFormZodSchema = z.object({
  name: z.string("Name is required").min(2, "Name must be at least 2 characters"),
  role: z.enum(TEAM_ROLES),
});

export type IUpdateTeamMemberFormValues = z.infer<typeof updateTeamMemberFormZodSchema>;

export const updateTeamMemberServerZodSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  role: z.enum(TEAM_ROLES, "Invalid role").optional(),
}) satisfies z.ZodType<IUpdateTeamMemberPayload>;

export const updateTeamMemberStatusServerZodSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"], "Status must be Active or Blocked"),
}) satisfies z.ZodType<IUpdateTeamMemberStatusPayload>;

export const resetTeamMemberPasswordFormZodSchema = z.object({
  newPassword: z.string("A new password is required").min(8, "At least 8 characters"),
});

export const resetTeamMemberPasswordServerZodSchema =
  resetTeamMemberPasswordFormZodSchema satisfies z.ZodType<IResetTeamMemberPasswordPayload>;

/* ----------------------------- agency profile ---------------------------- */

export const agencyProfileFormZodSchema = z.object({
  name: z.string("Agency name is required").trim().min(2, "At least 2 characters").max(120),
  email: z.string().trim().refine((value) => value === "" || z.email().safeParse(value).success, {
    message: "A valid email is required",
  }),
  phone: z.string().max(30, "Phone is too long"),
  address: z.string().max(500, "Address is too long"),
  logo: z.string().trim().refine((value) => value === "" || z.url().safeParse(value).success, {
    message: "Logo must be a valid URL",
  }),
});

export type IAgencyProfileFormValues = z.infer<typeof agencyProfileFormZodSchema>;

export const updateAgencyProfileServerZodSchema = z.object({
  name: z.string().trim().min(2, "Agency name must be at least 2 characters").max(120),
  email: z.preprocess(emptyStringToNull, z.email("A valid email is required").nullable()),
  phone: z.preprocess(emptyStringToNull, z.string().trim().max(30).nullable()),
  address: z.preprocess(emptyStringToNull, z.string().trim().max(500).nullable()),
  logo: z.preprocess(emptyStringToNull, z.url("Logo must be a valid URL").nullable()),
}) satisfies z.ZodType<IUpdateAgencyProfilePayload>;

/* ------------------------------- my profile ------------------------------ */

export const updateMyProfileFormZodSchema = z.object({
  name: z.string("Name is required").trim().min(2, "At least 2 characters").max(80),
});

export const updateMyProfileServerZodSchema =
  updateMyProfileFormZodSchema satisfies z.ZodType<IUpdateMyProfilePayload>;
