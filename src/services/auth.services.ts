"use server";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { setTokenInCookies } from "@/lib/tokenUtils";
import { deleteCookie } from "@/lib/cookiesUtils";
import { type IUser } from "@/types/user.types";

const BASE_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Multiple Server Components in the same request tree (sidebar, navbar, page
 * content) each call this independently. Without request-level dedup that's
 * several separate live round-trips per page load, and if any one of them is
 * slow or flaky that component silently loses its user while the others render
 * fine — the sidebar vanishing while the page content still shows. cache()
 * gives one real fetch per request, shared by every caller.
 *
 * Uses raw fetch, NOT httpClient: httpClient calls back into token refresh,
 * which would recurse through this function.
 */
export const getUserInfo = cache(async (): Promise<IUser | null> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const sessionToken = cookieStore.get("better-auth.session_token")?.value;

  if (!accessToken) return null;

  try {
    const res = await fetch(`${BASE_API_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `accessToken=${accessToken}; better-auth.session_token=${sessionToken ?? ""}`,
      },
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

export async function getNewTokensWithRefreshToken(refreshToken: string): Promise<boolean> {
  const res = await fetch(`${BASE_API_URL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `refreshToken=${refreshToken}` },
    cache: "no-store",
  });

  if (!res.ok) return false;

  const { data } = await res.json();
  const { accessToken, refreshToken: newRefreshToken, token } = data ?? {};

  if (accessToken) await setTokenInCookies("accessToken", accessToken);
  if (newRefreshToken) await setTokenInCookies("refreshToken", newRefreshToken);
  if (token) await setTokenInCookies("better-auth.session_token", token, 24 * 60 * 60);

  return true;
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
    await deleteCookie("accessToken");
    await deleteCookie("refreshToken");
    await deleteCookie("better-auth.session_token");
  }

  redirect("/login");
}
