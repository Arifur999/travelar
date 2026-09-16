/**
 * Telling "you are not signed in" apart from "we could not ask".
 *
 * Both used to collapse into `null`, and the dashboard shell redirected to
 * /login on `null` — so an API outage logged everybody out. The user then
 * could not sign back in either, because the same API was down, which makes a
 * brief outage look exactly like losing an account and its data.
 *
 * Kept separate from auth.services.ts (which is "use server" and reads
 * cookies) so the classification itself is a pure function with unit tests.
 */

export type SessionOutcome = "authenticated" | "unauthenticated" | "unavailable";

/** What the attempt to load /auth/me produced. */
export type SessionProbe =
  /** No access-token cookie: nothing was even asked. */
  | { kind: "no-token" }
  /** The request never completed — DNS, connection refused, timeout, TLS. */
  | { kind: "transport-failure" }
  | { kind: "response"; status: number };

export const classifySessionOutcome = (probe: SessionProbe): SessionOutcome => {
  if (probe.kind === "no-token") return "unauthenticated";
  if (probe.kind === "transport-failure") return "unavailable";

  const { status } = probe.kind === "response" ? probe : { status: 0 };

  if (status >= 200 && status < 300) return "authenticated";

  // The API's own answer that this session is no good. Only these two mean it.
  if (status === 401 || status === 403) return "unauthenticated";

  // 5xx, 502/503/504 from a proxy, or anything else unexpected: the session may
  // be perfectly valid and we simply cannot tell. Never treat it as signed out.
  if (status >= 500) return "unavailable";

  // 4xx that is not 401/403 (a 404 or 400 on /auth/me) means this build and the
  // API disagree about the contract — a deploy mismatch, not a logout.
  return "unavailable";
};
