/**
 * Response security headers for the web app.
 *
 * Two parts, because one of them changes per request:
 *  - STATIC_SECURITY_HEADERS — the same on every response, set in
 *    next.config.ts so static assets get them too.
 *  - the Content-Security-Policy — carries a fresh nonce per request, so it is
 *    built here and set by proxy.ts. Next reads the nonce out of the request's
 *    CSP header and puts it on its own scripts; next-themes gets it explicitly.
 *
 * Pure functions, no Next imports, so they can be unit-tested and used from
 * both next.config.ts and the proxy.
 */

const isProduction = process.env.NODE_ENV === "production";

export const createNonce = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
};

export const buildContentSecurityPolicy = (nonce: string, { dev = !isProduction } = {}) =>
  [
    "default-src 'self'",
    // Only scripts carrying this request's nonce run, plus what they load
    // ('strict-dynamic'). An injected <script> — even inline — has no nonce.
    // Dev adds 'unsafe-eval' for React Refresh.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // 'unsafe-inline' for styles, deliberately without a nonce: the UI renders
    // style="" attributes (progress bars, loader sizing, Radix positioning),
    // which a nonce cannot cover, and browsers ignore 'unsafe-inline' as soon
    // as a nonce is present. Style injection is far lower risk than script.
    "style-src 'self' 'unsafe-inline'",
    // Airline and agency logos are arbitrary https URLs an agency enters.
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // Every API call is made by the server; the browser only talks to this app.
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // No one may frame the app: clickjacking a "Delete" or "Transfer" button.
    "frame-ancestors 'none'",
  ].join("; ");

export const STATIC_SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // CSP frame-ancestors covers modern browsers; this covers the rest.
  { key: "X-Frame-Options", value: "DENY" },
  // Full URL same-origin only. The reset-password URL carries a live token, and
  // this keeps it out of any cross-origin Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Browsers ignore HSTS over plain http, so it is harmless locally, and it
  // makes a TLS deployment refuse downgrades. No includeSubDomains: this app
  // cannot know what else lives under the parent domain.
  ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
];
