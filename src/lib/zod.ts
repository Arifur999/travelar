import { z } from "zod";

/**
 * The one place the app imports zod from. Every schema file imports `z` from
 * here, so this configuration is applied before any schema is built.
 *
 * jitless: zod v4 compiles object parsers with `new Function` for speed, and
 * checks at schema construction whether it may by calling `Function("")`.
 * Under the app's Content-Security-Policy (no 'unsafe-eval') that probe is
 * blocked — zod falls back correctly, but every page reported a CSP violation,
 * which would bury a real one. Parsing without the JIT is plenty fast for form
 * and action validation.
 *
 * An ESLint rule forbids importing "zod" anywhere else, so the setting cannot
 * be bypassed by a schema created before this module runs.
 */
z.config({ jitless: true });

export { z };
