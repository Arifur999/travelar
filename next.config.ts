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

  // The headers that never change, on every response including static assets.
  // The Content-Security-Policy is per-request (it carries a nonce), so
  // proxy.ts sets that one.
  async headers() {
    return [{ source: "/:path*", headers: STATIC_SECURITY_HEADERS }];
  },
};

export default nextConfig;
