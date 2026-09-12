/**
 * Mirrors `prisma/schema/enums.prisma` in the backend, one union per enum.
 *
 * These are hand-mirrored on purpose — the alternative is importing generated
 * Prisma types across the repo boundary, which would drag the server client
 * into the browser bundle. The cost is that adding a member to a backend enum
 * means adding it here too; the compiler catches the omission at every
 * exhaustive switch and label map below.
 */

export type UserRole = "SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENCY_STAFF";

export type UserStatus = "ACTIVE" | "BLOCKED" | "DELETED";

export type AgencyStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED";

export type PlanFeature = "TICKETING" | "VISA" | "HAJJ_UMRAH" | "EXPENSE" | "REPORTS" | "CRM";

export type TicketStatus = "ISSUED" | "REISSUED" | "REFUNDED" | "VOID";

export type VisaStatus = "SUBMITTED" | "PROCESSING" | "APPROVED" | "REJECTED" | "DELIVERED";

export type HajjBookingStatus = "RESERVED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type HajjPackageType = "HAJJ" | "UMRAH";

export type HajjTier = "ECONOMY" | "PREMIUM" | "VIP";

export type HajjMealPlan = "NONE" | "BREAKFAST" | "FULL_BOARD";

export type HajjBatchStatus = "OPEN" | "FULL" | "DEPARTED" | "COMPLETED" | "CANCELLED";

export type HajjHotelType = "MAKKAH" | "MADINAH";

export type DocumentStatus = "PENDING" | "RECEIVED" | "VERIFIED";

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CARD"
  | "MOBILE_BANKING"
  | "CHEQUE"
  | "OTHER";

export type SubscriptionOrderStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export type PostingDirection = "IN" | "OUT";

export type PostingSource =
  | "OPENING"
  | "INVESTMENT"
  | "INVESTMENT_WITHDRAWAL"
  | "PROFIT_WITHDRAWAL"
  | "SUPPLIER_PAYMENT"
  | "SALES_PAYMENT"
  | "DATE_CHANGE_FEE"
  | "DUE_RECEIVED"
  | "EXPENSE"
  | "EMPLOYEE_PAYOUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "ADJUSTMENT";

export type CashAccountCategory = "OWNER_FUNDS" | "LOANS" | "SALES_BUYING" | "OTHERS";

export type CapitalFlowType = "INVEST" | "WITHDRAW";

export type AttendanceStatus = "PRESENT" | "ABSENT";

export type EmployeePayoutType = "SALARY" | "BONUS";

export type AnnouncementType = "INFO" | "FEATURE" | "MAINTENANCE" | "WARNING";

export type SupportCategory = "BILLING" | "TECHNICAL" | "FEATURE_REQUEST" | "OTHER";

export type SupportPriority = "LOW" | "MEDIUM" | "HIGH";

export type SupportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type PlanHistoryAction = "ASSIGNED" | "UPGRADED" | "DOWNGRADED" | "TRIAL_EXTENDED";

/* ------------------------------------------------------------------------ *
 * Display labels
 *
 * Enum values are SCREAMING_SNAKE on the wire. Never render one raw — go
 * through these maps so the wording is identical everywhere it appears, and a
 * new enum member becomes a compile error rather than a screen showing
 * "MOBILE_BANKING".
 * ------------------------------------------------------------------------ */

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Platform admin",
  AGENCY_ADMIN: "Agency admin",
  AGENCY_STAFF: "Staff",
};

export const AGENCY_STATUS_LABELS: Record<AgencyStatus, string> = {
  TRIAL: "Trial",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  SUSPENDED: "Suspended",
};

export const PLAN_FEATURE_LABELS: Record<PlanFeature, string> = {
  TICKETING: "Ticketing",
  VISA: "Visa processing",
  HAJJ_UMRAH: "Hajj & Umrah",
  EXPENSE: "Accounts & expenses",
  REPORTS: "Reports",
  // Gates nothing today: customers and collections are deliberately base
  // features, so a plan that sells CRM unlocks no extra module. Kept because
  // the backend enum still has it. See the note in lib/navItem.ts.
  CRM: "CRM",
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  ISSUED: "Issued",
  REISSUED: "Reissued",
  REFUNDED: "Refunded",
  VOID: "Void",
};

export const VISA_STATUS_LABELS: Record<VisaStatus, string> = {
  SUBMITTED: "Submitted",
  PROCESSING: "Processing",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DELIVERED: "Delivered",
};

export const HAJJ_BOOKING_STATUS_LABELS: Record<HajjBookingStatus, string> = {
  RESERVED: "Reserved",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export const HAJJ_PACKAGE_TYPE_LABELS: Record<HajjPackageType, string> = {
  HAJJ: "Hajj",
  UMRAH: "Umrah",
};

export const HAJJ_TIER_LABELS: Record<HajjTier, string> = {
  ECONOMY: "Economy",
  PREMIUM: "Premium",
  VIP: "VIP",
};

export const HAJJ_MEAL_PLAN_LABELS: Record<HajjMealPlan, string> = {
  NONE: "No meals",
  BREAKFAST: "Breakfast only",
  FULL_BOARD: "Full board",
};

export const HAJJ_BATCH_STATUS_LABELS: Record<HajjBatchStatus, string> = {
  OPEN: "Open",
  FULL: "Full",
  DEPARTED: "Departed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const HAJJ_HOTEL_TYPE_LABELS: Record<HajjHotelType, string> = {
  MAKKAH: "Makkah",
  MADINAH: "Madinah",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDING: "Pending",
  RECEIVED: "Received",
  VERIFIED: "Verified",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  CARD: "Card",
  MOBILE_BANKING: "Mobile banking",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

export const SUBSCRIPTION_ORDER_STATUS_LABELS: Record<SubscriptionOrderStatus, string> = {
  PENDING: "Pending",
  SUCCESS: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

/// Wording follows the Balance Dashboard columns of the source spreadsheet, so
/// a user who knows that sheet recognises every row of the ledger.
export const POSTING_SOURCE_LABELS: Record<PostingSource, string> = {
  OPENING: "Opening balance",
  INVESTMENT: "Investment in",
  INVESTMENT_WITHDRAWAL: "Investment withdrawn",
  PROFIT_WITHDRAWAL: "Profit withdrawn",
  SUPPLIER_PAYMENT: "Supplier payment",
  SALES_PAYMENT: "Sales payment",
  DATE_CHANGE_FEE: "Date change fee",
  DUE_RECEIVED: "Due received",
  EXPENSE: "Expense",
  EMPLOYEE_PAYOUT: "Employee payout",
  TRANSFER_IN: "Transfer in",
  TRANSFER_OUT: "Transfer out",
  ADJUSTMENT: "Adjustment",
};

export const CASH_ACCOUNT_CATEGORY_LABELS: Record<CashAccountCategory, string> = {
  OWNER_FUNDS: "Owner funds",
  LOANS: "Loans",
  SALES_BUYING: "Sales & buying",
  OTHERS: "Others",
};

export const CAPITAL_FLOW_TYPE_LABELS: Record<CapitalFlowType, string> = {
  INVEST: "Invest",
  WITHDRAW: "Withdraw",
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
};

export const EMPLOYEE_PAYOUT_TYPE_LABELS: Record<EmployeePayoutType, string> = {
  SALARY: "Salary",
  BONUS: "Bonus",
};

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  INFO: "Info",
  FEATURE: "New feature",
  MAINTENANCE: "Maintenance",
  WARNING: "Warning",
};

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  BILLING: "Billing",
  TECHNICAL: "Technical",
  FEATURE_REQUEST: "Feature request",
  OTHER: "Other",
};

export const SUPPORT_PRIORITY_LABELS: Record<SupportPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

/* ------------------------------------------------------------------------ *
 * Select options
 *
 * Derived from the label maps rather than written out again, so a <Select>
 * can never drift from what a table cell shows for the same value.
 * ------------------------------------------------------------------------ */

export type SelectOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export const toSelectOptions = <TValue extends string>(
  labels: Record<TValue, string>,
): SelectOption<TValue>[] =>
  (Object.keys(labels) as TValue[]).map((value) => ({ value, label: labels[value] }));

export const PAYMENT_METHOD_OPTIONS = toSelectOptions(PAYMENT_METHOD_LABELS);
export const CASH_ACCOUNT_CATEGORY_OPTIONS = toSelectOptions(CASH_ACCOUNT_CATEGORY_LABELS);
export const TICKET_STATUS_OPTIONS = toSelectOptions(TICKET_STATUS_LABELS);
export const VISA_STATUS_OPTIONS = toSelectOptions(VISA_STATUS_LABELS);
export const HAJJ_BOOKING_STATUS_OPTIONS = toSelectOptions(HAJJ_BOOKING_STATUS_LABELS);
export const HAJJ_PACKAGE_TYPE_OPTIONS = toSelectOptions(HAJJ_PACKAGE_TYPE_LABELS);
export const HAJJ_TIER_OPTIONS = toSelectOptions(HAJJ_TIER_LABELS);
export const HAJJ_MEAL_PLAN_OPTIONS = toSelectOptions(HAJJ_MEAL_PLAN_LABELS);
export const HAJJ_HOTEL_TYPE_OPTIONS = toSelectOptions(HAJJ_HOTEL_TYPE_LABELS);
export const DOCUMENT_STATUS_OPTIONS = toSelectOptions(DOCUMENT_STATUS_LABELS);
export const SUPPORT_CATEGORY_OPTIONS = toSelectOptions(SUPPORT_CATEGORY_LABELS);
export const SUPPORT_PRIORITY_OPTIONS = toSelectOptions(SUPPORT_PRIORITY_LABELS);
export const SUPPORT_STATUS_OPTIONS = toSelectOptions(SUPPORT_STATUS_LABELS);
export const ANNOUNCEMENT_TYPE_OPTIONS = toSelectOptions(ANNOUNCEMENT_TYPE_LABELS);
export const CAPITAL_FLOW_TYPE_OPTIONS = toSelectOptions(CAPITAL_FLOW_TYPE_LABELS);
export const EMPLOYEE_PAYOUT_TYPE_OPTIONS = toSelectOptions(EMPLOYEE_PAYOUT_TYPE_LABELS);
export const ATTENDANCE_STATUS_OPTIONS = toSelectOptions(ATTENDANCE_STATUS_LABELS);
export const PLAN_FEATURE_OPTIONS = toSelectOptions(PLAN_FEATURE_LABELS);

/* ------------------------------------------------------------------------ *
 * Badge tones
 *
 * Maps a status to the tone that renders it. Kept next to the labels so a
 * status gains a colour and a name in the same edit.
 * ------------------------------------------------------------------------ */

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export const TICKET_STATUS_TONES: Record<TicketStatus, BadgeTone> = {
  ISSUED: "success",
  REISSUED: "info",
  REFUNDED: "warning",
  VOID: "danger",
};

export const VISA_STATUS_TONES: Record<VisaStatus, BadgeTone> = {
  SUBMITTED: "neutral",
  PROCESSING: "info",
  APPROVED: "success",
  REJECTED: "danger",
  DELIVERED: "success",
};

export const HAJJ_BOOKING_STATUS_TONES: Record<HajjBookingStatus, BadgeTone> = {
  RESERVED: "warning",
  CONFIRMED: "success",
  CANCELLED: "danger",
  COMPLETED: "info",
};

export const AGENCY_STATUS_TONES: Record<AgencyStatus, BadgeTone> = {
  TRIAL: "info",
  ACTIVE: "success",
  EXPIRED: "warning",
  SUSPENDED: "danger",
};

export const SUPPORT_STATUS_TONES: Record<SupportStatus, BadgeTone> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export const SUBSCRIPTION_ORDER_STATUS_TONES: Record<SubscriptionOrderStatus, BadgeTone> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "danger",
  CANCELLED: "neutral",
};

export const DOCUMENT_STATUS_TONES: Record<DocumentStatus, BadgeTone> = {
  PENDING: "warning",
  RECEIVED: "info",
  VERIFIED: "success",
};
