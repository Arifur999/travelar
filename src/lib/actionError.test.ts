import { describe, expect, it } from "vitest";
import { getActionErrorMessage, isStaleServerAction } from "./actionError";

/** Builds the shape axios hands an `_action` when the API answered. */
const apiError = (status: number, data: unknown) => ({ response: { status, data } });

describe("getActionErrorMessage", () => {
  it("prefers the API's message on a client error", () => {
    const message = getActionErrorMessage(apiError(409, { success: false, message: "Customer already exists" }), "fallback");
    expect(message).toBe("Customer already exists");
  });

  it("keeps a 4xx message even when a request id came with it", () => {
    // The id would be noise here: the message already says what to fix.
    const message = getActionErrorMessage(
      apiError(400, { success: false, message: "Phone must be 11 digits", requestId: "4f3c9a1b-0000-4000-8000-0123456789ab" }),
      "fallback",
    );
    expect(message).toBe("Phone must be 11 digits");
  });

  it("replaces a 5xx message with something quotable", () => {
    const requestId = "4f3c9a1b-0000-4000-8000-0123456789ab";
    const message = getActionErrorMessage(apiError(500, { success: false, message: "Internal Server Error", requestId }), "fallback");

    // "Internal Server Error" is not actionable; the reference is.
    expect(message).not.toContain("Internal Server Error");
    expect(message).toContain(requestId);
  });

  it("still says something useful when a 5xx carried no id", () => {
    const message = getActionErrorMessage(apiError(503, { success: false, message: "Internal Server Error" }), "fallback");
    expect(message).toBe("Something went wrong on our side. Please try again.");
    expect(message).not.toContain("Reference");
  });

  it.each([
    ["a newline", "abcdefgh\ninjected"],
    ["too short", "abc"],
    ["too long", "a".repeat(65)],
    ["markup", "<script>alert(1)</script>"],
  ])("drops a request id that is not plausible (%s)", (_label, requestId) => {
    const message = getActionErrorMessage(apiError(500, { success: false, message: "boom", requestId }), "fallback");
    expect(message).toBe("Something went wrong on our side. Please try again.");
  });

  it("falls back to a JS error message when the request never reached the API", () => {
    expect(getActionErrorMessage(new Error("connect ECONNREFUSED"), "fallback")).toBe("connect ECONNREFUSED");
  });

  it("uses the caller's fallback for anything else", () => {
    expect(getActionErrorMessage("nope", "Could not save the customer")).toBe("Could not save the customer");
    expect(getActionErrorMessage(undefined, "Could not save the customer")).toBe("Could not save the customer");
    expect(getActionErrorMessage({ response: { status: 500 } }, "Could not save the customer")).toBe(
      "Something went wrong on our side. Please try again.",
    );
  });
});

describe("when the API cannot be reached at all", () => {
  it("does not repeat the address axios failed to connect to", () => {
    // Exactly what a user saw while the API container was restarting.
    const error = {
      code: "ECONNREFUSED",
      message: "connect ECONNREFUSED 172.18.0.6:5050",
      config: { method: "post", url: "/imports/run" },
    };

    const message = getActionErrorMessage(error, "Could not start the import");

    expect(message).not.toContain("172.18.0.6");
    expect(message).not.toContain("ECONNREFUSED");
    expect(message).toMatch(/try again/i);
  });

  it("still prefers what the API itself said, when it answered", () => {
    const error = {
      code: "ERR_BAD_REQUEST",
      response: { status: 409, data: { message: "An import is already running" } },
    };

    expect(getActionErrorMessage(error, "fallback")).toBe("An import is already running");
  });
});

describe("when the server says it has not the room", () => {
  it("shows what the API said, unlike every other 5xx", () => {
    // 507 is the one 5xx this API writes on purpose: an import bigger than the
    // memory the server gives it. The message names both figures, and it is
    // the only way the person finds out the fix is on their own server.
    const error = apiError(507, {
      message:
        "This server gives the API 512 MB of memory, and reading a 3 MB spreadsheet needs about 734 MB.",
      requestId: "req-507",
    });

    const message = getActionErrorMessage(error, "fallback");

    expect(message).toContain("512 MB");
    expect(message).not.toContain("Something went wrong");
  });

  it("still hides a genuine crash", () => {
    const error = apiError(500, { message: "Internal Server Error", requestId: "req-500" });

    expect(getActionErrorMessage(error, "fallback")).toContain("Something went wrong");
  });
});

describe("when the page is a version behind the server", () => {
  it("says to reload rather than repeating Next's id", () => {
    // Exactly what a user saw seconds after a release went out with their tab
    // already open. The id is meaningless to them and alarming to look at.
    const error = new Error(
      'Server Action "40b3f778a9c7b7703b508147a3f8e458897935b50e" was not found on the server.',
    );

    const message = getActionErrorMessage(error, "Could not start the import");

    expect(message).not.toContain("40b3f778");
    expect(message).toMatch(/reload/i);
  });

  it("is not confused by an ordinary failure", () => {
    expect(isStaleServerAction(new Error("connect ECONNREFUSED 10.0.0.1:5050"))).toBe(false);
    expect(isStaleServerAction(null)).toBe(false);
  });
});

describe("when the server is slow rather than absent", () => {
  it("does not tell someone to retry something that is still running", () => {
    // Reading a large workbook takes longer than the client waits. The server
    // is parsing it the whole time; retrying just starts a second one.
    const error = {
      code: "ECONNABORTED",
      message: "timeout of 30000ms exceeded",
      config: { method: "post", url: "/imports/preview" },
    };

    const message = getActionErrorMessage(error, "fallback");

    expect(message).toMatch(/took too long/i);
    expect(message).not.toMatch(/may be restarting/i);
  });

  it("still says restarting when nothing answered at all", () => {
    const error = { code: "ECONNREFUSED", message: "connect ECONNREFUSED 10.0.0.1:5050" };

    expect(getActionErrorMessage(error, "fallback")).toMatch(/may be restarting/i);
  });
});
