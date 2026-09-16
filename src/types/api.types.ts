/**
 * The envelope every backend route emits through `sendResponse`.
 *
 * `success` is the literal `true`/`false` rather than `boolean` on purpose:
 * an `_action` returns `ApiResponse<T> | ApiErrorResponse`, and the literal is
 * what lets `if (!result.success) return` narrow the rest of the function to
 * the success branch. With a plain `boolean` every component would need a cast
 * to reach `result.data`.
 */
export interface ApiResponse<TData = unknown> {
  success: true;
  message: string;
  data: TData;
  meta?: PaginationMeta;
}

/** Note `totalPages`, plural — the backend emits that exact key. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  /**
   * The API's x-request-id for the failed call, present on error envelopes.
   * `getActionErrorMessage` puts it in front of the user for a 5xx, where the
   * message itself says nothing actionable.
   */
  requestId?: string;
}

/**
 * A Prisma `Decimal` column as it arrives over the wire.
 *
 * Verified against the running API: a raw Prisma row serializes Decimal as a
 * **string** (`amount: "12500"`), because a JS number cannot hold the full
 * range safely. Endpoints that aggregate in the service layer run the value
 * through `toNumber()` first and send a real number.
 *
 * So the same concept arrives as either type depending on the endpoint. Always
 * read one through `toNumber()` from `lib/format` — never do arithmetic on it
 * directly, or `a.amount + b.amount` silently concatenates two strings.
 */
export type Money = number | string;

export type ActionResult<TData = unknown> = ApiResponse<TData> | ApiErrorResponse;
