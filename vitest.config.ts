import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests on pure, regression-prone logic only — formatting, query-string
 * serialization, permission rules, zod schemas. No DOM, no network, no
 * backend: the suite runs in seconds. See TESTING.md.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Dates are formatted in the runner's zone; pin it so a laptop in Dhaka
    // and a CI box in UTC agree.
    env: { TZ: "UTC" },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
