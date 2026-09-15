import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultDashboardRoute,
  getRouteOwner,
  getRouteOwnerForRole,
  isAuthRoute,
} from "./lib/authUtils";
import { jwtUtils } from "./lib/jwtUtils";
import { buildContentSecurityPolicy, createNonce } from "./lib/securityHeaders";
import { isTokenExpiringSoon } from "./lib/tokenUtils";
import { getNewTokensWithRefreshToken, getUserInfo } from "./services/auth.services";
import { type UserRole } from "./types/user.types";

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts` and the exported function to
 * `proxy`. There is no middleware.ts in this project.
 *
 * Besides routing, every response leaving here carries the Content-Security
 * Policy with a fresh nonce (lib/securityHeaders.ts). The nonce is also put on
 * the *request* headers — that is where Next reads it to tag its own scripts,
 * and where the root layout reads it for next-themes.
 */
export async function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const next = () => {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };
  const redirect = (url: URL) => {
    const response = NextResponse.redirect(url);
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  try {
    const { pathname } = request.nextUrl;
    const pathWithQuery = `${pathname}${request.nextUrl.search}`;

    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    const verified = accessToken
      ? jwtUtils.verifyToken(accessToken, process.env.JWT_ACCESS_SECRET as string)
      : null;
    const isValidAccessToken = Boolean(verified?.success);
    const userRole: UserRole | null =
      verified?.success && verified.decoded ? (verified.decoded.role as UserRole) : null;

    const routeOwner = getRouteOwner(pathname);
    const isAuth = isAuthRoute(pathname);

    // Rule 0 — refresh proactively, and tell httpClient we already did it so it
    // doesn't fire a second refresh for the same request.
    //
    // It then falls through to the other rules. It used to return here, so a
    // request that happened to arrive while the token was expiring skipped
    // route ownership and the forced password change entirely. The token
    // being refreshed is still valid, so the checks below can use it.
    if (isValidAccessToken && refreshToken && (await isTokenExpiringSoon(accessToken!))) {
      try {
        if (await getNewTokensWithRefreshToken(refreshToken)) {
          requestHeaders.set("x-token-refreshed", "1");
        }
      } catch (error) {
        console.error("Error refreshing token in proxy:", error);
      }
    }

    // Rule 1 — a signed-in user has no business on an auth page.
    if (isAuth && isValidAccessToken && userRole) {
      return redirect(new URL(getDefaultDashboardRoute(userRole), request.url));
    }

    // Rule 2 — public route, let it through.
    if (routeOwner === null) {
      return next();
    }

    // Rule 3 — protected route without a valid token: bounce to login,
    // preserving where they were headed.
    if (!isValidAccessToken || !userRole) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathWithQuery);
      return redirect(loginUrl);
    }

    // Rule 4 — enforce account state (a forced password change blocks
    // everything else until it's done).
    const userInfo = await getUserInfo();
    if (userInfo?.needPasswordChange && pathname !== "/change-password") {
      return redirect(new URL("/change-password", request.url));
    }

    // Rule 5 — any signed-in role may see COMMON routes.
    if (routeOwner === "COMMON") {
      return next();
    }

    // Rule 6 — wrong side of the product: send them to their own dashboard
    // rather than showing a 403 page.
    if (routeOwner !== getRouteOwnerForRole(userRole)) {
      return redirect(new URL(getDefaultDashboardRoute(userRole), request.url));
    }

    return next();
  } catch (error) {
    console.error("Error in proxy:", error);
    // Still send the policy: a routing failure must not also drop the CSP.
    return next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static, _next/image (build output)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next|favicon.ico|sitemap.xml|robots.txt|.well-known).*)",
  ],
};
