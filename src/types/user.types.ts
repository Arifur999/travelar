export type UserRole = "SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENCY_STAFF";

export type AgencyStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED";

export type PlanFeature = "TICKETING" | "VISA" | "HAJJ_UMRAH" | "REPORTS";

export interface IAgency {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    logo?: string;
    status: AgencyStatus;
    trialEndsAt?: string | null;
    subscriptionEndsAt?: string | null;
    planId?: string | null;
    plan?: IPlan | null;
}

export interface IPlan {
    id: string;
    name: string;
    description?: string;
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
    status: "ACTIVE" | "BLOCKED" | "DELETED";
    needPasswordChange: boolean;
    agencyId: string | null;
    agency?: IAgency | null;
}
