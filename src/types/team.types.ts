import { type AgencyStatus, type PlanFeature, type UserStatus } from "./enums.types";

export type TeamRole = "AGENCY_ADMIN" | "AGENCY_STAFF";

/**
 * A user inside the caller's agency, as `GET /team` returns it. The API picks
 * these columns explicitly, so better-auth internals never reach the client.
 */
export interface ITeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: UserStatus;
  /** Still holding the temporary password an admin set. */
  needPasswordChange: boolean;
  /**
   * The earliest admin still on the books — normally whoever registered the
   * agency. Derived by the API, not stored, and nobody inside the agency can
   * change this account.
   */
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateTeamMemberPayload {
  name: string;
  email: string;
  password: string;
  role?: TeamRole;
}

export interface IUpdateTeamMemberPayload {
  name?: string;
  role?: TeamRole;
}

export interface IUpdateTeamMemberStatusPayload {
  status: "ACTIVE" | "BLOCKED";
}

export interface IResetTeamMemberPasswordPayload {
  newPassword: string;
}

/** `GET /agency/profile`. Billing fields are read-only here. */
export interface IAgencyProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
  status: AgencyStatus;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  createdAt: string;
  plan: { id: string; name: string; features: PlanFeature[] } | null;
  team: {
    total: number;
    admins: number;
    staff: number;
    blocked: number;
    /** Lets the UI know whether the viewer is the owner without paging for it. */
    ownerId: string | null;
  };
}

/** The contact email is absent: the API fixes it at registration. */
export interface IUpdateAgencyProfilePayload {
  name?: string;
  /** null clears the field on the API; undefined leaves it untouched. */
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
}

export interface IUpdateMyProfilePayload {
  name: string;
}
