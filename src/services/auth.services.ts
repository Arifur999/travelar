"use server";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import { getForwardedForHeader } from "@/lib/forwardedFor";
import { setTokenInCookies } from "@/lib/tokenUtils";
import { deleteCookie } from "@/lib/cookiesUtils";
import { type ApiResponse } from "@/types/api.types";
import { describeApiFailure } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { classifySessionOutcome, type SessionProbe } from "@/lib/sessionOutcome";
import {
  type IChangePasswordPayload,
  type IForgotPasswordPayload,
  type ILoginPayload,
  type ILoginResponse,
  type IMyFeatures,
  type IRegisterPayload,
  type IRegisterResponse,
  type IResetPasswordPayload,
  type IUser,
} from "@/types/user.types";

/**
 * Every function in this file uses raw fetch, NOT httpClient.
 *
 * httpClient calls back into token refresh, which lives here — routing these
 * through it would make the module graph circular and, worse, let a refresh
 * recurse into itself.
 */
const buildAuthHeader = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const sessionToken = cookieStore.get("better-auth.session_token")?.value;

  return {
    "Content-Type": "application/json",
    Cookie: `accessToken=${accessToken ?? ""}; better-auth.session_token=${sessionToken ?? ""}`,
  };
};

/**
 * Writes the three tokens from a login or register reply onto this origin.
 *
 * The API sets them as cookies on its own response too, but that response is
 * consumed server-side by this Next app — the browser never sees those headers,
 * so they have to be re-set here or the user stays signed out.
 */
const persistTokens = async (tokens: {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
}) => {
  if (tokens.accessToken) await setTokenInCookies("accessToken", tokens.accessToken);
  if (tokens.refreshToken) await setTokenInCookies("refreshToken", tokens.refreshToken);
  if (tokens.token) await setTokenInCookies("better-auth.session_token", tokens.token, 24 * 60 * 60);
};

export type Session =
  | { outcome: "authenticated"; user: IUser }
  /** Signed out, or the API says this session is no good. Send them to /login. */
  | { outcome: "unauthenticated"; user: null }
  /**
   * We could not ask. The session may be perfectly valid — show that the
   * service is unreachable, and do NOT send them to /login: they cannot sign
   * in either while the API is down, so it reads as losing their account.
   */
  | { outcome: "unavailable"; user: null };

/**
 * Who the API says the caller is, and — when it cannot say — why.
 *
 * Multiple Server Components in the same request tree (sidebar, navbar, page
 * content) each ask independently. Without request-level dedup that's several
 * separate live round-trips per page load, and if any one of them is slow or
 * flaky that component silently loses its user while the others render fine —
 * the sidebar vanishing while the page content still shows. cache() gives one
 * real fetch per request, shared by every caller.
 */
export const loadSession = cache(async (): Promise<Session> => {
  const cookieStore = await cookies();
  if (!cookieStore.get("accessToken")?.value) {
    return { outcome: "unauthenticated", user: null };
  }

  let probe: SessionProbe;
  let body: { data?: IUser } | null = null;

  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
      method: "GET",
      headers: await buildAuthHeader(),
      cache: "no-store",
    });
    probe = { kind: "response", status: res.status };
    if (res.ok) body = await res.json();
  } catch (error) {
    probe = { kind: "transport-failure" };
    logger.warn("could not reach the API to load the session", describeApiFailure(error));
  }

  const outcome = classifySessionOutcome(probe);

  if (outcome === "authenticated" && body?.data) {
    return { outcome, user: body.data };
  }
  if (outcome === "authenticated") {
    // 2xx without a user is the API contract breaking, not a logout.
    logger.warn("the API returned a session with no user");
    return { outcome: "unavailable", user: null };
  }
  if (outcome === "unavailable" && probe.kind === "response") {
    logger.warn("the API could not answer who the user is", { status: probe.status });
  }

  return { outcome, user: null };
});

/**
 * The signed-in user, or null.
 *
 * NOTE: `null` here means "no user to show" and covers BOTH being signed out
 * and the API being unreachable. That is fine for a page that simply renders
 * nothing without a user, but a caller that decides whether to send someone to
 * /login MUST use `loadSession()` and check the outcome — see the dashboard
 * layout. Redirecting on this `null` is what turned an outage into a logout.
 */
export const getUserInfo = cache(async (): Promise<IUser | null> => (await loadSession()).user);

/**
 * Drives every feature lock in the UI. Cached per request for the same reason
 * as getUserInfo — the sidebar, the page, and any gated panel all ask for it
 * while rendering one screen.
 *
 * Returns null rather than throwing: a signed-in SUPER_ADMIN has no agency and
 * legitimately has no feature set, and a transient failure should grey the
 * locks out, not blank the whole dashboard.
 */
export const getMyFeatures = cache(async (): Promise<IMyFeatures | null> => {
  const cookieStore = await cookies();
  if (!cookieStore.get("accessToken")?.value) return null;

  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/my-features`, {
      method: "GET",
      headers: await buildAuthHeader(),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const { data } = await res.json();
    return data as IMyFeatures;
  } catch (error) {
    logger.warn("could not load the agency features", describeApiFailure(error));
    return null;
  }
});

export async function getNewTokensWithRefreshToken(refreshToken: string): Promise<boolean> {
  const res = await fetch(`${getApiBaseUrl()}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `refreshToken=${refreshToken}` },
    cache: "no-store",
  });

  if (!res.ok) return false;

  const { data } = await res.json();
  const { accessToken, refreshToken: newRefreshToken, token } = data ?? {};

  await persistTokens({ accessToken, refreshToken: newRefreshToken, token });

  return true;
}

/**
 * Throws on failure so the calling _action can normalize the message. The
 * thrown Error carries the API message, which is what the user needs to see
 * ("Invalid email or password", "This account has been deactivated").
 */
export async function loginUser(payload: ILoginPayload): Promise<ApiResponse<ILoginResponse>> {
  const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    // The API rate-limits this route per client address; see forwardedFor.ts.
    headers: { "Content-Type": "application/json", ...(await getForwardedForHeader()) },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await res.json();

  if (!res.ok || !body?.success) {
    throw new Error(body?.message ?? "Could not sign you in");
  }

  await persistTokens(body.data);

  return body as ApiResponse<ILoginResponse>;
}

export async function registerAgency(
  payload: IRegisterPayload,
): Promise<ApiResponse<IRegisterResponse>> {
  const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
    method: "POST",
    // The API rate-limits this route per client address; see forwardedFor.ts.
    headers: { "Content-Type": "application/json", ...(await getForwardedForHeader()) },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await res.json();

  if (!res.ok || !body?.success) {
    throw new Error(body?.message ?? "Could not complete registration");
  }

  // Registration signs the new admin straight in — the API issues a session
  // alongside the agency, so there is no second trip through /login.
  await persistTokens(body.data);

  return body as ApiResponse<IRegisterResponse>;
}

/**
 * The API revokes every other session on success, so the tokens held here are
 * stale afterwards. They are cleared and the user is bounced to /login rather
 * than left holding credentials the server no longer honours.
 */
export async function changePassword(
  payload: IChangePasswordPayload,
): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(`${getApiBaseUrl()}/auth/change-password`, {
    method: "POST",
    headers: await buildAuthHeader(),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await res.json();

  if (!res.ok || !body?.success) {
    throw new Error(body?.message ?? "Could not change your password");
  }

  return body as ApiResponse<{ message: string }>;
}

/**
 * Always resolves the same way for any well-formed address — the API never says
 * whether an account exists. Only a rate limit or an outage throws.
 */
export async function requestPasswordReset(
  payload: IForgotPasswordPayload,
): Promise<ApiResponse<null>> {
  const res = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
    method: "POST",
    // Rate-limited per client address and per email; see forwardedFor.ts.
    headers: { "Content-Type": "application/json", ...(await getForwardedForHeader()) },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await res.json();

  if (!res.ok || !body?.success) {
    throw new Error(body?.message ?? "Could not send a reset link");
  }

  return body as ApiResponse<null>;
}

/** Throws with the API's message — typically "invalid or has expired". */
export async function resetPassword(payload: IResetPasswordPayload): Promise<ApiResponse<null>> {
  const res = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await getForwardedForHeader()) },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await res.json();

  if (!res.ok || !body?.success) {
    throw new Error(body?.message ?? "Could not reset your password");
  }

  return body as ApiResponse<null>;
}

export async function clearAuthCookies() {
  await deleteCookie("accessToken");
  await deleteCookie("refreshToken");
  await deleteCookie("better-auth.session_token");
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    await fetch(`${getApiBaseUrl()}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken ?? ""}`,
      },
    });
  } catch (error) {
    logger.warn("server logout failed; clearing cookies anyway", describeApiFailure(error));
  } finally {
    // Clear locally regardless — a failed server call must not leave the user
    // stuck in a half-signed-in state.
    await clearAuthCookies();
  }

  redirect("/login");
}
