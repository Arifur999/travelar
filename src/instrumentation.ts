import { type Instrumentation } from "next";
import { describeApiFailure, hasApiResponse } from "@/lib/apiError";
import { logger } from "@/lib/logger";

/**
 * Server-side error reporting for the web tier.
 *
 * `error.tsx` shows the user `error.digest` as "Ref: …" — Next's own id for
 * the failure, and the only thing that survives to the browser, since React
 * scrubs the message in production. Nothing recorded what a digest referred
 * to, so a user quoting one had nothing anyone could look up.
 *
 * This writes that mapping: digest -> route, plus the API's own `requestId`
 * when the render failed because an API call did. Support then goes
 * digest (on screen) -> this line -> requestId -> the API's logs, which is the
 * whole chain from a complaint to a stack trace.
 *
 * `onRequestError` fires for render, route-handler, server-action and proxy
 * failures alike. It is NOT called for an error an `_action.ts` catches — those
 * are returned to the component as a message, which is the point of them.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  // React may replace the thrown instance while rendering Server Components,
  // so the digest is read defensively rather than from a known type.
  const digest =
    error && typeof error === "object" && "digest" in error ? String((error as { digest: unknown }).digest) : undefined;

  logger.error("unhandled server error", {
    digest,
    // The route file, e.g. /dashboard/customers/[id] — not the resolved URL,
    // which carries ids and search terms.
    routePath: context.routePath,
    routeType: context.routeType,
    method: request.method,
    // Never `request.headers`: it holds the session cookies.
    ...(hasApiResponse(error) ? { api: describeApiFailure(error) } : {}),
    ...(error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) }),
  });
};
