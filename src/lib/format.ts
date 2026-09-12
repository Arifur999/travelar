import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

/**
 * The API sends Decimal columns as JSON numbers, but a few aggregate endpoints
 * return them as strings to avoid precision loss on large sums. Everything
 * here takes `unknown` and coerces, so a caller never has to guess which.
 */
export const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const BDT = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const BDT_WHOLE = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

/**
 * Every money figure in the product goes through here. The agency operates in
 * BDT only — there is no per-tenant currency column on the backend, so this
 * deliberately does not take one rather than pretending to be configurable.
 */
export const formatCurrency = (value: unknown, options?: { whole?: boolean }) => {
  const amount = toNumber(value);
  return options?.whole ? BDT_WHOLE.format(amount) : BDT.format(amount);
};

/**
 * Compact form for stat tiles, where a full figure would wrap: 13.7L, 2.4Cr.
 * Uses lakh/crore rather than K/M because that is how the figures are read in
 * the market this serves.
 */
export const formatCurrencyCompact = (value: unknown) => {
  const amount = toNumber(value);
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);

  if (abs >= 10_000_000) return `${sign}৳${(abs / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000) return `${sign}৳${(abs / 100_000).toFixed(2)}L`;
  if (abs >= 1_000) return `${sign}৳${(abs / 1_000).toFixed(1)}K`;
  return `${sign}৳${abs.toFixed(0)}`;
};

const NUMBER = new Intl.NumberFormat("en-BD");

export const formatNumber = (value: unknown) => NUMBER.format(toNumber(value));

export const formatPercent = (value: unknown, fractionDigits = 1) =>
  `${toNumber(value).toFixed(fractionDigits)}%`;

/**
 * Margin as a share of revenue. Returns null rather than 0 when there is no
 * revenue — a tile showing "0.0%" for an agency with no sales reads as a real
 * measured zero, which it is not.
 */
export const calculateMarginPercent = (profit: unknown, revenue: unknown): number | null => {
  const total = toNumber(revenue);
  if (total === 0) return null;
  return (toNumber(profit) / total) * 100;
};

/* --------------------------------- dates -------------------------------- */

/**
 * The API serializes every DateTime as an ISO string. Parsing is tolerant
 * because a nullable column arrives as null and a few come back as a Date
 * through the prefetch/hydration boundary.
 */
const parse = (value: unknown): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : parseISO(String(value));
  return isValid(date) ? date : null;
};

export const formatDate = (value: unknown, fallback = "—") => {
  const date = parse(value);
  return date ? format(date, "dd MMM yyyy") : fallback;
};

export const formatDateTime = (value: unknown, fallback = "—") => {
  const date = parse(value);
  return date ? format(date, "dd MMM yyyy, h:mm a") : fallback;
};

/** For a `<input type="date">` value, which only ever accepts yyyy-MM-dd. */
export const formatDateForInput = (value: unknown) => {
  const date = parse(value);
  return date ? format(date, "yyyy-MM-dd") : "";
};

export const formatRelative = (value: unknown, fallback = "—") => {
  const date = parse(value);
  return date ? `${formatDistanceToNowStrict(date)} ago` : fallback;
};

/**
 * Whole days from now until `value`, rounded up, floored at zero. Drives the
 * trial banner — a trial with 4 hours left has to read "1 day left", not "0",
 * because zero looks like it has already lapsed.
 */
export const daysUntil = (value: unknown): number | null => {
  const date = parse(value);
  if (!date) return null;
  const ms = date.getTime() - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / (1000 * 60 * 60 * 24));
};

/* -------------------------------- strings ------------------------------- */

/** Avatar fallback: "Arifur Rahman" becomes "AR". */
export const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

export const truncate = (value: string, maxLength: number) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
