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
 * The 5xx codes whose message the API wrote on purpose.
 *
 * Hiding 5xx text is right almost everywhere — it is a crash dump, and
 * "Internal Server Error" helps nobody. 507 is the exception: the API sends
 * it when an import is bigger than the memory the server gives it, and the
 * message is the only thing that says so. Swallowing that one leaves the
 * person staring at "something went wrong" with no idea that the fix is a
 * setting on their own server.
 */
const DELIBERATE_SERVER_ERRORS = new Set([507]);

/**
 * Whether this failure is a page left open across a deployment.
 *
 * Next gives every server action an id derived from the build, so a tab
 * that was already open when a release went out calls an id the new server
 * has never heard of. It looks alarming — "Server Action
 * 40b3f778...35b50e was not found on the server" — and it means nothing
 * worse than: this page is from the previous version. Every action in the
 * app can hit it, so it is recognised in one place.
 */
export const isStaleServerAction = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /server action .* was not found|failed to find server action/i.test(message);
};

/** What to tell someone whose page is a version behind. */
export const STALE_PAGE_MESSAGE =
  "The app was updated while this page was open. Reload the page and try again.";

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
  if (isStaleServerAction(error)) return STALE_PAGE_MESSAGE;

  const failure = describeApiFailure(error);

  if (
    failure.status !== undefined &&
    failure.status >= 500 &&
    !DELIBERATE_SERVER_ERRORS.has(failure.status)
  ) {
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
