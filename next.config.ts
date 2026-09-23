import type { NextConfig } from "next";
import { STATIC_SECURITY_HEADERS } from "./src/lib/securityHeaders";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a minimal server.js and only the node_modules
  // it traces, which is what the Dockerfile ships. `next start` still serves
  // locally but warns that it is unsupported with this setting; the supported
  // local production run is `node .next/standalone/server.js` (after copying
  // .next/static and public in, as the Dockerfile does).
  output: "standalone",

  // No "X-Powered-By: Next.js" — it only helps someone pick an exploit.
  poweredByHeader: false,

  experimental: {
    serverActions: {
      // An agency's whole book of business arrives through a Server Action on
      // the Previous data screen, and the default cap is 1MB — a real client's
      // workbook is several times that, so every upload failed before it ever
      // reached the API. This is above the API's own 15MB limit on the file,
      // with room for what multipart adds around it, so the size is refused in
      // one place with one message rather than three.
      bodySizeLimit: "20mb",
    },
  },

  // The headers that never change, on every response including static assets.
  // The Content-Security-Policy is per-request (it carries a nonce), so
  // proxy.ts sets that one.
  async headers() {
    return [{ source: "/:path*", headers: STATIC_SECURITY_HEADERS }];
  },
};

export default nextConfig;
