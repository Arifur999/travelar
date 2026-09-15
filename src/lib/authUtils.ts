import { type UserRole } from "@/types/user.types";

export const authRoles = ["/login", "/register", "/forgot-password", "/reset-password"];

export const isAuthRoute = (pathname: string) => authRoles.some((route) => route === pathname);

export type RouteConfig = {
  exact: string[];
  pattern: RegExp[];
};

/** Any signed-in user, whatever their role. */
export const commonProtectedRoutes: RouteConfig = {
  exact: ["/my-profile", "/change-password"],
  pattern: [],
};

/** The platform operator's console — agencies must never reach it. */
export const platformProtectedRoutes: RouteConfig = {
  exact: [],
  // Whole path segments only: a bare prefix also claimed /admin/dashboardx.
  pattern: [/^\/admin\/dashboard(?:\/|$)/],
};

/** The agency workspace, shared by AGENCY_ADMIN and AGENCY_STAFF. */
export const agencyProtectedRoutes: RouteConfig = {
  // Where SSLCommerz sends the browser back to. The backend redirects to
  // /billing/payment-result?status=...&tran_id=... — one route carrying the
  // outcome as a param, not three separate paths.
  exact: ["/billing/payment-result"],
  pattern: [/^\/dashboard(?:\/|$)/],
};

export const isRouteMatches = (pathname: string, routes: RouteConfig) => {
  if (routes.exact.includes(pathname)) return true;
  return routes.pattern.some((pattern) => pattern.test(pathname));
};

export type RouteOwner = "PLATFORM" | "AGENCY" | "COMMON" | null;

/** null means the route is public. */
export const getRouteOwner = (pathname: string): RouteOwner => {
  if (isRouteMatches(pathname, commonProtectedRoutes)) return "COMMON";
  if (isRouteMatches(pathname, platformProtectedRoutes)) return "PLATFORM";
  if (isRouteMatches(pathname, agencyProtectedRoutes)) return "AGENCY";
  return null;
};

/**
 * AGENCY_ADMIN and AGENCY_STAFF share one workspace — the difference between
 * them is enforced per-action, not by a separate route tree.
 */
export const getRouteOwnerForRole = (role: UserRole): Exclude<RouteOwner, null | "COMMON"> =>
  role === "SUPER_ADMIN" ? "PLATFORM" : "AGENCY";

export const getDefaultDashboardRoute = (role: UserRole) => {
  if (role === "SUPER_ADMIN") return "/admin/dashboard";
  return "/dashboard";
};

/**
 * Guards the ?redirect= param so a crafted login link can't bounce a user
 * somewhere their role can't see — which would also leak which routes exist.
 */
export const isValidRedirectForRole = (redirectPath: string, role: UserRole) => {
  const owner = getRouteOwner(redirectPath.split("?")[0]);
  if (owner === null || owner === "COMMON") return true;
  return owner === getRouteOwnerForRole(role);
};
