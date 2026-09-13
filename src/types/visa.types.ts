import { type Money } from "./api.types";
import {
  type DocumentStatus,
  type PaymentMethod,
  type VisaStatus,
} from "./enums.types";

interface IRef {
  id: string;
  name: string;
}

/** An embassy, consultancy or agent a case can be routed through. */
export interface IVisaAgent {
  id: string;
  agencyId: string;
  name: string;
  type?: string | null;
  contact?: string | null;
  email?: string | null;
  address?: string | null;
  note?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IVisaDocument {
  id: string;
  agencyId: string;
  visaCaseId: string;
  title: string;
  status: DocumentStatus;
  fileUrl?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IVisaPayment {
  id: string;
  agencyId: string;
  visaCaseId: string;
  /** Raw Prisma row, so a Decimal string. Read through toNumber(). */
  amount: Money;
  method: PaymentMethod;
  cashAccountId: string;
  cashAccount: IRef;
  reference?: string | null;
  note?: string | null;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IVisaStatusHistory {
  id: string;
  visaCaseId: string;
  fromStatus?: VisaStatus | null;
  toStatus: VisaStatus;
  note?: string | null;
  changedById?: string | null;
  changedAt: string;
}

/**
 * A visa application.
 *
 *   totalFee  = serviceFee + embassyFee
 *   dueAmount = totalFee − Σ payments
 *
 * Neither is stored: the two fees are the only inputs, so deriving is cheaper
 * than keeping a total in step with them.
 */
export interface IVisaCase {
  id: string;
  agencyId: string;

  customerId: string;
  customer: { id: string; name: string; phone: string; passportNo?: string | null };

  visaAgentId?: string | null;
  visaAgent?: { id: string; name: string; type?: string | null } | null;

  country: string;
  visaType: string;
  applicationNo?: string | null;
  submittedAt?: string | null;
  decidedAt?: string | null;

  serviceFee: Money;
  embassyFee: Money;

  status: VisaStatus;
  rejectionNote?: string | null;

  createdById?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  /* --- derived in the service, so real numbers --- */
  totalFee: number;
  totalPaid: number;
  dueAmount: number;
  /** `received` counts anything past PENDING, so RECEIVED and VERIFIED both. */
  documentsProgress: { received: number; total: number };
}

export interface IVisaCaseDetail extends IVisaCase {
  documents: IVisaDocument[];
  payments: IVisaPayment[];
  statusHistory: IVisaStatusHistory[];
}

export interface IVisaCasesListResponse {
  cases: IVisaCase[];
  summary: {
    totalRevenue: number;
    totalPaid: number;
    totalDue: number;
  };
}

export interface ICreateVisaCasePayload {
  customerId: string;
  visaAgentId?: string;
  country: string;
  visaType: string;
  applicationNo?: string;
  submittedAt?: string;
  serviceFee?: number;
  embassyFee?: number;
}

/** `customerId` is omitted by the API: a case cannot change hands. */
export type IUpdateVisaCasePayload = Omit<Partial<ICreateVisaCasePayload>, "customerId">;

export interface IChangeVisaStatusPayload {
  status: Extract<VisaStatus, "PROCESSING" | "APPROVED" | "REJECTED" | "DELIVERED">;
  note?: string;
}

export interface IRecordVisaPaymentPayload {
  cashAccountId: string;
  amount: number;
  method?: PaymentMethod;
  reference?: string;
  note?: string;
  paidAt?: string;
}

export interface ICreateVisaAgentPayload {
  name: string;
  type?: string;
  contact?: string;
  email?: string;
  address?: string;
  note?: string;
}

/**
 * One-way lifecycle, mirroring VISA_TRANSITIONS on the backend. REJECTED and
 * DELIVERED are final.
 *
 * Note it is stricter than the ticket machine: a case must pass through
 * PROCESSING before it can be approved or rejected.
 */
export const VISA_TRANSITIONS: Record<VisaStatus, VisaStatus[]> = {
  SUBMITTED: ["PROCESSING"],
  PROCESSING: ["APPROVED", "REJECTED"],
  APPROVED: ["DELIVERED"],
  REJECTED: [],
  DELIVERED: [],
};

export const isVisaFinal = (status: VisaStatus) => VISA_TRANSITIONS[status].length === 0;

/**
 * Document checklists seeded onto a new case from its visa type, lower-cased.
 * Mirrors VISA_DOCUMENT_PRESETS so the form can show what will be created
 * before the case exists.
 */
export const VISA_TYPE_PRESETS = [
  "Tourist",
  "Work",
  "Student",
  "Business",
  "Umrah",
  "Other",
] as const;
