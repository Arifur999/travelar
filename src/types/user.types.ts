import {
  type AgencyStatus,
  type PlanFeature,
  type UserRole,
  type UserStatus,
} from "./enums.types";

export type { AgencyStatus, PlanFeature, UserRole, UserStatus };

export interface IAgency {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
  status: AgencyStatus;
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
  planId?: string | null;
  plan?: IPlan | null;
}

export interface IPlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  durationDays: number;
  features: PlanFeature[];
  isActive: boolean;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  status: UserStatus;
  needPasswordChange: boolean;
  agencyId: string | null;
  agency?: IAgency | null;
}

/**
 * What `GET /auth/my-features` returns. The backend derives this from the same
 * code path as `checkFeatureAccess`, so a module the sidebar shows as unlocked
 * is one the API will actually serve — the two cannot disagree.
 *
 * `features` is empty for a lapsed trial or an expired subscription even
 * before the nightly job flips the agency status.
 */
export interface IMyFeatures {
  features: PlanFeature[];
  isTrial: boolean;
  trialEndsAt: string | null;
  status: AgencyStatus;
  subscriptionEndsAt: string | null;
  planName: string | null;
}

/* --------------------------- auth request bodies -------------------------- */

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IRegisterPayload {
  agencyName: string;
  agencyPhone?: string;
  name: string;
  email: string;
  password: string;
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface IForgotPasswordPayload {
  email: string;
}

export interface IResetPasswordPayload {
  /** From the ?token= of the emailed link. */
  token: string;
  newPassword: string;
}

/* -------------------------- auth response payloads ------------------------ */

/**
 * The backend sets these three as httpOnly cookies on its own response *and*
 * returns them in the body. The body copy is what matters here: the API runs on
 * a different origin, so its Set-Cookie headers never reach the browser through
 * a server-side call — the action has to re-set them on this origin.
 */
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  /** better-auth session token; opaque, carries no exp of its own. */
  token: string;
}

export interface ILoginResponse extends IAuthTokens {
  user: Pick<IUser, "id" | "name" | "email" | "role" | "agencyId" | "needPasswordChange">;
}

export interface IRegisterResponse extends IAuthTokens {
  user: Pick<IUser, "id" | "name" | "email" | "role" | "agencyId">;
  agency: Pick<IAgency, "id" | "name" | "status" | "trialEndsAt">;
}
