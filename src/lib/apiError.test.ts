import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { describeApiFailure, hasApiResponse } from "./apiError";

/**
 * The reason this module exists is a leak, so most of these are regression
 * tests. `console.error(axiosError)` printed `config.headers`, and this app
 * forwards the browser's whole cookie jar to the API — so every failed request
 * wrote a live session token into the web server's log.
 */

const COOKIE_JAR = "accessToken=LEAKED_ACCESS_JWT; refreshToken=LEAKED_REFRESH; better-auth.session_token=LEAKED_SESSION";
const SECRETS = ["LEAKED_ACCESS_JWT", "LEAKED_REFRESH", "LEAKED_SESSION"];

/** The shape httpClient actually throws, cookie jar and all. */
const axiosFailure = (status: number | undefined, data: unknown) =>
  new AxiosError(
    status === undefined ? "timeout of 30000ms exceeded" : `Request failed with status code ${status}`,
    status === undefined ? "ECONNABORTED" : "ERR_BAD_RESPONSE",
    {
      method: "get",
      url: "/customers/abc-123/ledger?searchTerm=top-secret-search",
      baseURL: "http://api.internal:5000/api/v1",
      headers: { Cookie: COOKIE_JAR, "Content-Type": "application/json" },
    } as never,
    {},
    status === undefined ? undefined : ({ status, data, headers: {}, statusText: "", config: {} } as never),
  );

describe("describeApiFailure", () => {
  it("never carries a cookie, a token or a header", () => {
    const failure = describeApiFailure(
      axiosFailure(500, { success: false, message: "Internal Server Error", requestId: "4f3c9a1b-req" }),
    );
    const serialized = JSON.stringify(failure);

    for (const secret of SECRETS) expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain("Cookie");
    expect(serialized).not.toContain("accessToken");
    // Proof the fixture really did hold them, so this test cannot pass vacuously.
    expect(JSON.stringify(COOKIE_JAR)).toContain("LEAKED_ACCESS_JWT");
  });

  it("drops the query string, which holds search terms and tokens", () => {
    const failure = describeApiFailure(axiosFailure(404, { message: "Not found" }));

    expect(failure.path).toBe("/customers/abc-123/ledger");
    expect(JSON.stringify(failure)).not.toContain("top-secret-search");
  });

  it("keeps what is actually useful", () => {
    const failure = describeApiFailure(
      axiosFailure(500, { success: false, message: "Internal Server Error", requestId: "4f3c9a1b-req" }),
    );

    expect(failure).toEqual({
      status: 500,
      requestId: "4f3c9a1b-req",
      message: "Internal Server Error",
      code: "ERR_BAD_RESPONSE",
      method: "GET",
      path: "/customers/abc-123/ledger",
    });
  });

  it("explains a request that never landed", () => {
    // No response at all: the axios message is the only account of what happened.
    const failure = describeApiFailure(axiosFailure(undefined, undefined));

    expect(failure.status).toBeUndefined();
    expect(failure.code).toBe("ECONNABORTED");
    expect(failure.message).toBe("timeout of 30000ms exceeded");
    expect(JSON.stringify(failure)).not.toContain("LEAKED_ACCESS_JWT");
  });

  it("omits keys it could not determine rather than emitting nulls", () => {
    const failure = describeApiFailure(new Error("boom"));

    expect(Object.keys(failure)).toEqual(["message"]);
    expect(failure.message).toBe("boom");
  });

  it("survives anything at all being thrown", () => {
    expect(describeApiFailure(undefined)).toEqual({});
    expect(describeApiFailure(null)).toEqual({});
    expect(describeApiFailure("a string")).toEqual({});
    expect(describeApiFailure({ response: "not an object" })).toEqual({});
    expect(describeApiFailure({ response: { status: "500" } })).toEqual({});
  });

  it("reads a non-JSON error body without inventing fields", () => {
    // httpGetFile decodes a PDF endpoint's JSON error; when the bytes are not
    // JSON, `data` stays an ArrayBuffer.
    const failure = describeApiFailure(axiosFailure(500, new ArrayBuffer(8)));

    expect(failure.status).toBe(500);
    expect(failure.requestId).toBeUndefined();
  });
});

describe("hasApiResponse", () => {
  it("separates an answered request from one that never landed", () => {
    expect(hasApiResponse(axiosFailure(503, { message: "nope" }))).toBe(true);
    expect(hasApiResponse(axiosFailure(undefined, undefined))).toBe(false);
    expect(hasApiResponse(new Error("boom"))).toBe(false);
  });
});
