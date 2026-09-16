/**
 * Turns whatever a service threw into a message a component can show.
 * Precedence: the API's own message, then a JS Error message, then the
 * caller's fallback.
 */

/**
 * Same shape the API's `x-request-id` middleware accepts. The id reaches the
 * user's screen, so it is validated even though we generated it: an unexpected
 * value belongs nowhere near a message a component renders.
 */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{8,64}$/;

/**
 * A 5xx message is the API's own crash text — "Internal Server Error" tells
 * the user nothing they can act on. The request id does: quoting it is what
 * lets whoever reads the logs find the exact failure. 4xx messages are
 * deliberate and stay as they are.
 */
const SERVER_ERROR_MESSAGE = "Something went wrong on our side. Please try again.";

interface ErrorBody {
  status?: number;
  message?: string;
  requestId?: string;
}

/** Unwraps the axios error shape without pulling axios into the bundle. */
const readErrorBody = (error: unknown): ErrorBody | null => {
  if (!error || typeof error !== "object" || !("response" in error)) return null;
  const response = (error as { response?: unknown }).response;
  if (!response || typeof response !== "object") return null;

  const status = (response as { status?: unknown }).status;
  const data = (response as { data?: unknown }).data;
  const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  return {
    status: typeof status === "number" ? status : undefined,
    message: typeof body.message === "string" ? body.message : undefined,
    requestId: typeof body.requestId === "string" ? body.requestId : undefined,
  };
};

export const getActionErrorMessage = (error: unknown, fallbackMessage: string) => {
  const body = readErrorBody(error);

  if (body) {
    if (body.status !== undefined && body.status >= 500) {
      return body.requestId && SAFE_REQUEST_ID.test(body.requestId)
        ? `${SERVER_ERROR_MESSAGE} Reference: ${body.requestId}`
        : SERVER_ERROR_MESSAGE;
    }
    if (body.message) return body.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};
