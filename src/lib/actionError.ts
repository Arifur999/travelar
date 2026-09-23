import { describeApiFailure } from "./apiError";

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

/**
 * The request never landed, so there is no API message — only axios's, and
 * axios names the address it failed to reach. "connect ECONNREFUSED
 * 172.18.0.6:5050" reached a user's screen: it tells them nothing they can
 * act on, and tells anyone reading it where the API lives on the internal
 * network. What they need to know is that it is worth trying again.
 */
const UNREACHABLE_MESSAGE =
  "Could not reach the server. It may be restarting — wait a moment and try again.";

export const getActionErrorMessage = (error: unknown, fallbackMessage: string) => {
  const failure = describeApiFailure(error);

  if (failure.status !== undefined && failure.status >= 500) {
    return failure.requestId && SAFE_REQUEST_ID.test(failure.requestId)
      ? `${SERVER_ERROR_MESSAGE} Reference: ${failure.requestId}`
      : SERVER_ERROR_MESSAGE;
  }

  if (failure.status !== undefined && failure.message) {
    return failure.message;
  }

  // A transport code and no status: the call never got an answer.
  if (failure.status === undefined && failure.code) {
    return UNREACHABLE_MESSAGE;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};
