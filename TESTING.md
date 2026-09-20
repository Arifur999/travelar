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
| `src/lib/actionError.test.ts` | A 4xx keeps the API's own message; a 5xx is replaced with a sentence plus the request id, so a user can quote something the logs can be searched for. An implausible id is dropped rather than rendered. |
| `src/lib/apiError.test.ts` | Regression for a real leak: `console.error(axiosError)` printed `config.headers`, i.e. the forwarded accessToken, refreshToken and session token. Asserts a described failure can never carry a cookie, a header or the query string. |
| `src/instrumentation.test.ts` | The support chain: the digest shown on the error page is logged against the API's own requestId, with the stack, and without the session cookies or the resolved URL. |
| `src/lib/sessionOutcome.test.ts` | Only the API's own 401/403 may end a session. Every other status and an unreachable API must leave the user signed in and show that the service is down — redirecting on any missing user is what made an outage look like a logout. |
| `src/lib/dashboardCharts.test.ts` | What the home-page charts draw: month labels (year only where the window crosses one), per-metric empty states, month-over-month change with no fake figure from a zero month, sales-mix slices without zero or negative modules, account bars capped at a limit without losing the total or hiding an overdraft, and goal rings that show "not tracked" rather than 0%. |
| `src/lib/setupSteps.test.ts` | The first-run checklist: which steps a plan can actually do (a plan without EXPENSE is never told to add a cash account, one without a sales module is never told to sell), which module the sale step points at, and that the card counts itself complete — and hides — once every step it shows is done. |
| `src/lib/pickerOptions.test.ts` | What each searchable picker shows and can find: customers by phone and by passport (never shown), what a customer owes or a supplier is owed when paying, blank passports left out, name order, and two people with the same name kept apart. |
| `src/components/shared/form/SearchableSelect.test.ts` | Search is plain "every word appears", not fuzzy — five phone digits used to match any number that merely contained them in order — and it never matches the hidden record id, whose hex would make "a" match everyone. |

The payloads services send are checked separately, against the API source rather than a mock: `pnpm check:contract` compares every mutation's payload type with the zod schema of the API route it calls, and fails on a field the API would silently drop, a required field never sent, or a call no route answers. CI checks out the API repo for it.

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
