import { NextRequest, NextResponse } from "next/server";
import {
  getDefaultDashboardRoute,
  getRouteOwner,
  getRouteOwnerForRole,
  isAuthRoute,
} from "./lib/authUtils";
import { jwtUtils } from "./lib/jwtUtils";
import { isTokenExpiringSoon } from "./lib/tokenUtils";
import { getNewTokensWithRefreshToken, getUserInfo } from "./services/auth.services";
import { type UserRole } from "./types/user.types";

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts` and the exported function to
 * `proxy`. There is no middleware.ts in this project.
 */
export async function proxy(request: NextRequest) {
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
    if (isValidAccessToken && refreshToken && (await isTokenExpiringSoon(accessToken!))) {
      const requestHeaders = new Headers(request.headers);
      try {
        if (await getNewTokensWithRefreshToken(refreshToken)) {
          requestHeaders.set("x-token-refreshed", "1");
        }
      } catch (error) {
        console.error("Error refreshing token in proxy:", error);
      }
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Rule 1 — a signed-in user has no business on an auth page.
    if (isAuth && isValidAccessToken && userRole) {
      return NextResponse.redirect(new URL(getDefaultDashboardRoute(userRole), request.url));
    }

    // Rule 2 — public route, let it through.
    if (routeOwner === null) {
      return NextResponse.next();
    }

    // Rule 3 — protected route without a valid token: bounce to login,
    // preserving where they were headed.
    if (!isValidAccessToken || !userRole) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathWithQuery);
      return NextResponse.redirect(loginUrl);
    }

    // Rule 4 — enforce account state (a forced password change blocks
    // everything else until it's done).
    const userInfo = await getUserInfo();
    if (userInfo?.needPasswordChange && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }

    // Rule 5 — any signed-in role may see COMMON routes.
    if (routeOwner === "COMMON") {
      return NextResponse.next();
    }

    // Rule 6 — wrong side of the product: send them to their own dashboard
    // rather than showing a 403 page.
    if (routeOwner !== getRouteOwnerForRole(userRole)) {
      return NextResponse.redirect(new URL(getDefaultDashboardRoute(userRole), request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error in proxy:", error);
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
