import { describe, expect, it } from "vitest";
import { classifySessionOutcome, type SessionProbe } from "./sessionOutcome";

/**
 * Regression: every one of these used to collapse into `null`, and the
 * dashboard shell redirected to /login on `null`. So an API outage signed
 * everyone out — and they could not sign back in, because that needs the same
 * API. A brief outage was indistinguishable from losing the account.
 */

describe("classifySessionOutcome", () => {
  it("treats no cookie as signed out", () => {
    expect(classifySessionOutcome({ kind: "no-token" })).toBe("unauthenticated");
  });

  it("treats an unreachable API as unavailable, never as signed out", () => {
    expect(classifySessionOutcome({ kind: "transport-failure" })).toBe("unavailable");
  });

  it.each([200, 201, 204, 299])("accepts a %i as a live session", (status) => {
    expect(classifySessionOutcome({ kind: "response", status })).toBe("authenticated");
  });

  it.each([401, 403])("accepts only the API's own %i as signed out", (status) => {
    expect(classifySessionOutcome({ kind: "response", status })).toBe("unauthenticated");
  });

  it.each([500, 502, 503, 504])("treats a %i as unavailable", (status) => {
    expect(classifySessionOutcome({ kind: "response", status })).toBe("unavailable");
  });

  it.each([400, 404, 418, 429])("treats an unexpected %i as unavailable, not signed out", (status) => {
    // A 404 or 400 on /auth/me means this build and the API disagree about the
    // contract — a deploy mismatch. Logging everyone out is the wrong response.
    expect(classifySessionOutcome({ kind: "response", status })).toBe("unavailable");
  });

  /**
   * The property that actually protects the user: of every status the API could
   * possibly answer with, only 401 and 403 may end a session. Anything else
   * must leave them signed in and say the service is unreachable.
   */
  it("never reports signed out for any status except 401 and 403", () => {
    const wrongly: number[] = [];

    for (let status = 100; status <= 599; status += 1) {
      const outcome = classifySessionOutcome({ kind: "response", status });
      if (outcome === "unauthenticated" && status !== 401 && status !== 403) {
        wrongly.push(status);
      }
    }

    expect(wrongly).toEqual([]);
  });

  it("never reports a live session for anything outside 2xx", () => {
    const wrongly: number[] = [];

    for (let status = 100; status <= 599; status += 1) {
      if (status >= 200 && status < 300) continue;
      if (classifySessionOutcome({ kind: "response", status }) === "authenticated") {
        wrongly.push(status);
      }
    }

    expect(wrongly).toEqual([]);
    // And neither non-response probe may ever grant a session.
    const probes: SessionProbe[] = [{ kind: "no-token" }, { kind: "transport-failure" }];
    for (const probe of probes) {
      expect(classifySessionOutcome(probe)).not.toBe("authenticated");
    }
  });
});
