import { headers } from "next/headers";

/**
 * Passes the browser's address on to the API as X-Forwarded-For.
 *
 * Every API call is made by this Next server, so without it the API sees one
 * address — this server's — for every user. Its login rate limit is per
 * address, which turned that into a platform-wide lockout: twenty sign-ins by
 * anyone in fifteen minutes and nobody else could sign in.
 *
 * The last entry of the incoming header is used. Next fills the header with
 * the socket address when nothing set it, and a reverse proxy in front
 * appends the address it saw, so the last entry is always the nearest hop's
 * view of the client. (A client talking to Next directly with no proxy can
 * still write that header itself — which is why the API also limits login
 * attempts per account, not only per address.)
 *
 * Only callable where a request is in scope: Server Components, server
 * actions, route handlers.
 */
export const getForwardedForHeader = async (): Promise<Record<string, string>> => {
  const incoming = (await headers()).get("x-forwarded-for");
  const clientIp = incoming?.split(",").at(-1)?.trim();
  return clientIp ? { "X-Forwarded-For": clientIp } : {};
};
