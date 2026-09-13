import { type Money } from "./api.types";
import { type AttendanceStatus, type EmployeePayoutType } from "./enums.types";

interface IRef {
  id: string;
  name: string;
}

/**
 * A staff member.
 *
 * Whether someone still works here is decided by one thing — do they have a
 * resign date. There is no separate `isActive` column to drift out of step with
 * it, which is what the old model kept in sync with a save hook. `isActive`
 * below is derived by the service, not stored.
 */
export interface IEmployee {
  id: string;
  agencyId: string;
  name: string;
  phone: string;
  address?: string | null;
  joinDate: string;
  resignDate?: string | null;
  createdById?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  /* --- derived in the service --- */
  isActive: boolean;
  workingMonths: number;
  workingDays: number;
  totalSalary: number;
  totalBonus: number;
  subtotal: number;
}

export interface IEmployeesListResponse {
  employees: IEmployee[];
  summary: {
    activeCount: number;
    totalCount: number;
    resignedCount: number;
  };
}

export interface IEmployeeDashboard {
  data: IEmployee[];
  summary: {
    totalEmployees: number;
    activeCount: number;
    resignedCount: number;
    totalSalary: number;
    totalBonus: number;
  };
}

export interface IEmployeeTransaction {
  id: string;
  agencyId: string;
  employeeId: string;
  employee: { id: string; name: string; phone: string };
  date: string;
  type: EmployeePayoutType;
  /** Raw Prisma row, so a Decimal string. Read through toNumber(). */
  amount: Money;
  cashAccountId: string;
  cashAccount: IRef;
  /** Days covered by a salary payment. Only meaningful when type is SALARY. */
  totalDays?: number | null;
  note?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IEmployeeTransactionsListResponse {
  transactions: IEmployeeTransaction[];
  summary: {
    totalSalary: number;
    totalBonus: number;
    subtotal: number;
  };
}

/**
 * One row per employee per calendar day — the API enforces that uniqueness.
 *
 * `date` is a calendar day, not an instant: the column is `@db.Date`, which
 * sidesteps the timezone bug in the previous implementation where the write
 * path normalised with local `setHours(0,0,0,0)` while the read filter used a
 * UTC string.
 */
export interface IEmployeeAttendance {
  id: string;
  agencyId: string;
  employeeId: string;
  employee: { id: string; name: string; phone: string };
  date: string;
  status: AttendanceStatus;
  /** Wall-clock labels as typed, e.g. "09:30 AM" — not instants. */
  startTime?: string | null;
  endTime?: string | null;
  /** Computed from the two times by the API. */
  totalHours: Money;
  note?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IAttendanceSummary {
  presentCount: number;
  absentCount: number;
  daysRecorded: number;
}

/* -------------------------------- payloads ------------------------------- */

export interface ICreateEmployeePayload {
  name: string;
  phone: string;
  address?: string;
  joinDate: string;
  /** null clears it, marking the employee active again. */
  resignDate?: string | null;
}

export type IUpdateEmployeePayload = Partial<ICreateEmployeePayload>;

export interface ICreateEmployeeTransactionPayload {
  employeeId: string;
  cashAccountId: string;
  type: EmployeePayoutType;
  amount: number;
  totalDays?: number;
  date?: string;
  note?: string;
}

export interface ICreateAttendancePayload {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  startTime?: string;
  endTime?: string;
  note?: string;
}

/** What the API's time fields accept: "09:30 AM", "6:00 PM". */
export const TIME_PATTERN = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;
