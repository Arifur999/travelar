/**
 * The backend's base URL, including `/api/v1`, read when a request is made.
 *
 * Server-only on purpose, and not `NEXT_PUBLIC_*`. Next inlines every
 * NEXT_PUBLIC_ variable at build time — in server bundles too — so the old
 * `NEXT_PUBLIC_API_BASE_URL` froze whatever URL the image was built with, and
 * one image could never point at a different API. Every caller is a Server
 * Component, server action or the proxy, so the browser never needs it.
 *
 * Read lazily and thrown at call time rather than at import: `next build`
 * imports these modules while collecting pages, and a build has no business
 * needing the runtime API address.
 */
export const getApiBaseUrl = (): string => {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error("API_BASE_URL is not set — point it at the backend, including /api/v1");
  }
  return url.replace(/\/+$/, "");
};
