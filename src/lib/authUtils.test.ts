import { describe, expect, it } from "vitest";
import {
  getDefaultDashboardRoute,
  getRouteOwner,
  getRouteOwnerForRole,
  isAuthRoute,
  isValidRedirectForRole,
} from "./authUtils";

/** The route-ownership table proxy.ts enforces. A wrong row is a hole or a lockout. */

describe("getRouteOwner", () => {
  it.each([
    ["/dashboard", "AGENCY"],
    ["/dashboard/tickets", "AGENCY"],
    // File downloads are route handlers, not pages; they must still be guarded.
    ["/dashboard/invoices/ticket/0199a7e2-0000-7000-8000-000000000000", "AGENCY"],
    // Where the payment gateway sends the browser back.
    ["/billing/payment-result", "AGENCY"],
    ["/admin/dashboard", "PLATFORM"],
    ["/admin/dashboard/agencies", "PLATFORM"],
    ["/my-profile", "COMMON"],
    ["/change-password", "COMMON"],
  ])("%s belongs to %s", (path, owner) => {
    expect(getRouteOwner(path)).toBe(owner);
  });

  // Regression: prefix patterns also claimed /dashboardx and /admin/dashboardx.
  it.each(["/", "/login", "/register", "/dashboardx", "/admin", "/admin/dashboardx"])("%s is public", (path) => {
    expect(getRouteOwner(path)).toBeNull();
  });
});

describe("roles", () => {
  it("send each role to its own side", () => {
    expect(getRouteOwnerForRole("SUPER_ADMIN")).toBe("PLATFORM");
    expect(getRouteOwnerForRole("AGENCY_ADMIN")).toBe("AGENCY");
    expect(getRouteOwnerForRole("AGENCY_STAFF")).toBe("AGENCY");
    expect(getDefaultDashboardRoute("SUPER_ADMIN")).toBe("/admin/dashboard");
    expect(getDefaultDashboardRoute("AGENCY_STAFF")).toBe("/dashboard");
  });

  it("recognise the auth pages exactly", () => {
    expect(isAuthRoute("/login")).toBe(true);
    expect(isAuthRoute("/login/extra")).toBe(false);
  });
});

describe("isValidRedirectForRole", () => {
  // A crafted ?redirect= must not bounce a user into the other side's routes.
  it("allows a redirect within the user's own side, public and common pages", () => {
    expect(isValidRedirectForRole("/dashboard/tickets?page=2", "AGENCY_STAFF")).toBe(true);
    expect(isValidRedirectForRole("/admin/dashboard/plans", "SUPER_ADMIN")).toBe(true);
    expect(isValidRedirectForRole("/my-profile", "SUPER_ADMIN")).toBe(true);
    expect(isValidRedirectForRole("/", "AGENCY_ADMIN")).toBe(true);
  });

  it("refuses a redirect across sides", () => {
    expect(isValidRedirectForRole("/admin/dashboard", "AGENCY_ADMIN")).toBe(false);
    expect(isValidRedirectForRole("/dashboard", "SUPER_ADMIN")).toBe(false);
  });
});
