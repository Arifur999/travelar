import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a minimal server.js and only the node_modules
  // it traces, which is what the Dockerfile ships. `next start` still serves
  // locally but warns that it is unsupported with this setting; the supported
  // local production run is `node .next/standalone/server.js` (after copying
  // .next/static and public in, as the Dockerfile does).
  output: "standalone",
};

export default nextConfig;
