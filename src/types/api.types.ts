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
}

export type ActionResult<TData = unknown> = ApiResponse<TData> | ApiErrorResponse;
