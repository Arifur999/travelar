import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { onRequestError } from "./instrumentation";
import { type LogFields, type LogLevel, setLogWriter } from "@/lib/logger";

/**
 * The chain a support request travels: the user quotes the "Ref:" from the
 * error page, that digest finds this line, and this line names the API's
 * requestId — which finds the stack trace in the API's own logs. Each link is
 * asserted here, along with the session cookies staying out of all of it.
 */

const SESSION_COOKIE = "accessToken=LEAKED_ACCESS_JWT; better-auth.session_token=LEAKED_SESSION";

type Entry = LogFields & { level: LogLevel; msg: string };

let lines: Entry[] = [];
let restore: () => void;

beforeEach(() => {
  lines = [];
  restore = setLogWriter((_line, entry) => void lines.push(entry));
});
afterEach(() => restore());

/** What Next hands `onRequestError` for a failed Server Component render. */
const request = {
  path: "/dashboard/customers/abc-123?searchTerm=top-secret-search",
  method: "GET",
  headers: { cookie: SESSION_COOKIE, "user-agent": "Mozilla/5.0" },
};

const context = {
  routerKind: "App Router",
  routePath: "/dashboard/customers/[id]",
  routeType: "render",
  renderSource: "react-server-components",
  revalidateReason: undefined,
  renderType: "dynamic",
} as const;

const apiError = (digest: string) =>
  Object.assign(
    new AxiosError(
      "Request failed with status code 500",
      "ERR_BAD_RESPONSE",
      { method: "get", url: "/customers/abc-123", headers: { Cookie: SESSION_COOKIE } } as never,
      {},
      {
        status: 500,
        data: { success: false, message: "Internal Server Error", requestId: "api-4f3c9a1b" },
      } as never,
    ),
    { digest },
  );

describe("onRequestError", () => {
  it("files the digest the user sees against the API's request id", () => {
    onRequestError(apiError("3216548970"), request, context as never);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      level: "error",
      msg: "unhandled server error",
      digest: "3216548970",
      routePath: "/dashboard/customers/[id]",
      routeType: "render",
      method: "GET",
      api: { status: 500, requestId: "api-4f3c9a1b", path: "/customers/abc-123" },
    });
  });

  it("never logs the session cookies or the resolved URL", () => {
    onRequestError(apiError("3216548970"), request, context as never);
    const serialized = JSON.stringify(lines[0]);

    expect(serialized).not.toContain("LEAKED_ACCESS_JWT");
    expect(serialized).not.toContain("LEAKED_SESSION");
    expect(serialized).not.toContain("top-secret-search");
    // The route file is logged instead of the path, so no customer id either.
    expect(serialized).not.toContain("abc-123?");
  });

  it("keeps the stack, which is the whole point of the line", () => {
    onRequestError(apiError("3216548970"), request, context as never);

    expect(lines[0].name).toBe("AxiosError");
    expect(String(lines[0].stack)).toContain("instrumentation.test.ts");
  });

  it("omits the api field when the failure had nothing to do with the API", () => {
    onRequestError(Object.assign(new TypeError("x is not a function"), { digest: "111" }), request, context as never);

    expect(lines[0]).toMatchObject({ digest: "111", name: "TypeError", message: "x is not a function" });
    expect(lines[0].api).toBeUndefined();
  });

  it("records a thrown non-error rather than dropping it", () => {
    onRequestError("just a string", request, context as never);

    expect(lines[0]).toMatchObject({ msg: "unhandled server error", message: "just a string" });
    expect(lines[0].digest).toBeUndefined();
  });
});
