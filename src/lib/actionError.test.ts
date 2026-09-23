import { describe, expect, it } from "vitest";
import { getActionErrorMessage } from "./actionError";

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
