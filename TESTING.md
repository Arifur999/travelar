# Testing

Vitest, unit tests only, on pure logic that fails silently when it regresses.
No DOM, no network, no backend — the suite runs in about two seconds.

```bash
pnpm test          # once
pnpm test:watch    # while working
```

## What is tested, and why those

| File | Guards |
|---|---|
| `src/lib/queryString.test.ts` | The server's query string must be byte-identical to the browser's `searchParams.toString()` — both are the React Query key. A space encoded as `%20` vs `+` once threw away every multi-word search's prefetch. |
| `src/lib/authUtils.test.ts` | The route-ownership table `proxy.ts` enforces, and `?redirect=` validation. A wrong row is a hole or a lockout. |
| `src/lib/teamPermissions.test.ts` | Must mirror the API's owner/admin/staff rules, or the UI offers what the API refuses. Temporary passwords avoid look-alike characters. |
| `src/lib/format.test.ts` | Money in ৳ and lakh/crore, margins that are `null` (not 0%) without revenue, dates, "1 day left" rounding. |
| `src/lib/securityHeaders.test.ts` | The CSP stays strict: scripts only with the nonce, no `unsafe-inline`/`unsafe-eval` in production, no framing, no plugins, no foreign connections; the static headers are present. |
| `src/zod/auth.validation.test.ts` | Password recovery: email normalization, matching passwords, token and length bounds that mirror the API. |
| `src/zod/team.validation.test.ts` | Email normalization, blank-means-null for the agency profile, roles an agency cannot grant. |

Not tested here, on purpose: components, pages, services and actions. They are
wiring, and testing them needs a mock API that has to be kept in step with the
real one. What the API does — tenant isolation, auth, money — is covered by
the backend's integration suite against a real database; see its `TESTING.md`.

## Conventions

- Colocated: `<unit>.test.ts` next to the unit.
- Explicit imports from `vitest`, no globals. `describe` names the export; `it`
  is a sentence about behaviour.
- A test that exists because of a real bug says so in a comment. Keep it.
- `vitest.config.ts` pins `TZ=UTC` so date output is the same on every machine.

## Why vitest is a dev dependency

The pattern this repo follows keeps Vitest out of `package.json`, because a
Vercel deploy installs from a frozen lockfile and adding a dev dependency
changes what it installs. That reason does not apply here: the app ships as a
Docker image built from the committed lockfile, and CI runs the tests, which
needs a pinned version. So it is installed like any other dev dependency, and
test files are type-checked with the rest of `src`.
