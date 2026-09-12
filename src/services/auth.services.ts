"use server";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { setTokenInCookies } from "@/lib/tokenUtils";
import { deleteCookie } from "@/lib/cookiesUtils";
import { type ApiResponse } from "@/types/api.types";
import {
  type IChangePasswordPayload,
  type ILoginPayload,
  type ILoginResponse,
  type IMyFeatures,
  type IRegisterPayload,
  type IRegisterResponse,
  type IUser,
} from "@/types/user.types";

const BASE_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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

/**
 * Multiple Server Components in the same request tree (sidebar, navbar, page
 * content) each call this independently. Without request-level dedup that's
 * several separate live round-trips per page load, and if any one of them is
 * slow or flaky that component silently loses its user while the others render
 * fine — the sidebar vanishing while the page content still shows. cache()
 * gives one real fetch per request, shared by every caller.
 */
export const getUserInfo = cache(async (): Promise<IUser | null> => {
  const cookieStore = await cookies();
  if (!cookieStore.get("accessToken")?.value) return null;

  try {
    const res = await fetch(`${BASE_API_URL}/auth/me`, {
      method: "GET",
      headers: await buildAuthHeader(),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const { data } = await res.json();
    return data as IUser;
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
});

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
    const res = await fetch(`${BASE_API_URL}/auth/my-features`, {
      method: "GET",
      headers: await buildAuthHeader(),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const { data } = await res.json();
    return data as IMyFeatures;
  } catch (error) {
    console.error("Error fetching agency features:", error);
    return null;
  }
});

export async function getNewTokensWithRefreshToken(refreshToken: string): Promise<boolean> {
  const res = await fetch(`${BASE_API_URL}/auth/refresh-token`, {
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
  const res = await fetch(`${BASE_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${BASE_API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${BASE_API_URL}/auth/change-password`, {
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

export async function clearAuthCookies() {
  await deleteCookie("accessToken");
  await deleteCookie("refreshToken");
  await deleteCookie("better-auth.session_token");
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    await fetch(`${BASE_API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken ?? ""}`,
      },
    });
  } catch (error) {
    console.error("Error logging out:", error);
  } finally {
    // Clear locally regardless — a failed server call must not leave the user
    // stuck in a half-signed-in state.
    await clearAuthCookies();
  }

  redirect("/login");
}
