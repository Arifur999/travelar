"use server";

import { setCookie } from "./cookiesUtils";
import { jwtUtils } from "./jwtUtils";

const DEFAULT_MAX_AGE = 60 * 60 * 24;

export const getTokenSecondsRemaining = async (token: string) => {
  const decoded = jwtUtils.decodeToken(token);
  if (!decoded?.exp) return 0;
  return decoded.exp - Math.floor(Date.now() / 1000);
};

/**
 * Derive maxAge from the JWT itself so the cookie and the token expire
 * together. better-auth's session token is opaque and carries no exp, so it
 * falls back to the supplied default.
 */
export const setTokenInCookies = async (
  name: string,
  token: string,
  fallbackMaxAgeInSeconds = DEFAULT_MAX_AGE,
) => {
  const remaining =
    name === "better-auth.session_token"
      ? fallbackMaxAgeInSeconds
      : await getTokenSecondsRemaining(token);

  await setCookie(name, token, remaining > 0 ? remaining : fallbackMaxAgeInSeconds);
};

export const isTokenExpiringSoon = async (token: string, thresholdInSeconds = 300) => {
  const remaining = await getTokenSecondsRemaining(token);
  return remaining > 0 && remaining <= thresholdInSeconds;
};

export const isTokenExpired = async (token: string) => {
  return (await getTokenSecondsRemaining(token)) <= 0;
};
