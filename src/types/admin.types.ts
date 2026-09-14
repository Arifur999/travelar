import { type Money } from "./api.types";
import {
  type AgencyStatus,
  type PlanFeature,
  type PlanHistoryAction,
  type UserRole,
  type UserStatus,
} from "./enums.types";
import { type IPlan } from "./user.types";

export interface IAdminAgency {
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
  plan?: { id: string; name: string } | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPlanHistoryEntry {
  id: string;
  agencyId: string;
  planId?: string | null;
  plan?: { id: string; name: string } | null;
  action: PlanHistoryAction;
  assignedAt: string;
  note?: string | null;
}

export interface IAdminAgencyDetail extends Omit<IAdminAgency, "plan"> {
  plan: IPlan | null;
  users: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  }[];
  planHistories: IPlanHistoryEntry[];
}

/**
 * Platform-wide figures.
 *
 * `mrr` normalises every active plan's price to a 30-day month, so a yearly
 * plan contributes a twelfth of its price rather than the whole thing.
 */
export interface IPlatformStats {
  totalAgencies: number;
  /** Sparse — a status with no agencies is absent, so read with `?? 0`. */
  byStatus: Partial<Record<AgencyStatus, number>>;
  expiringSoon: number;
  onlineRevenue: number;
  manualRevenue: number;
  totalRevenue: number;
  mrr: number;
  openTickets: number;
}

export interface IActivityLogEntry {
  id: string;
  adminId: string;
  admin?: { id: string; name: string; email: string } | null;
  action: string;
  targetType: string;
  /** Polymorphic — points at whichever table targetType names, so no relation. */
  targetId?: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface IAdminPlan {
  id: string;
  name: string;
  description?: string | null;
  /** Raw Prisma row, so a Decimal string. Read through toNumber(). */
  price: Money;
  durationDays: number;
  features: PlanFeature[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreatePlanPayload {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  features?: PlanFeature[];
  isActive?: boolean;
}

export interface IUpdateAgencyStatusPayload {
  /** TRIAL is absent: an agency cannot be put back on trial by hand. */
  status: Extract<AgencyStatus, "ACTIVE" | "EXPIRED" | "SUSPENDED">;
}

export interface IAssignPlanPayload {
  planId: string;
}

export interface IExtendTrialPayload {
  days: number;
}
