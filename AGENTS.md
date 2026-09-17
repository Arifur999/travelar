<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
## Commands

```bash
pnpm dev                           # webpack dev server, http://localhost:3000 — needs the API running
pnpm lint                          # also enforces the no-console and zod-import rules below
pnpm test                          # vitest unit tests, ~2s (see TESTING.md)
pnpm test src/lib/format.test.ts   # one file
pnpm build                         # standalone output; also the full type-check, test files included
pnpm check:contract                # every mutation payload vs the API schema (needs ../travel_agency_backend)
```

There is no separate typecheck script. CI runs `lint → test → build`, then builds the Docker image.

## Project rules

Travelar is a **multi-tenant B2B SaaS**: each travel agency is a tenant, and the
API scopes every business row on `agencyId`. The API lives in
[travelar_backend](https://github.com/Arifur999/travelar_backend).

- **Layering is `component → _action → service → httpClient`.** A component never imports `httpClient`. Mutations go through an `_action.ts` colocated with the route; it catches, normalizes via `getActionErrorMessage`, and returns `ApiResponse<T> | ApiErrorResponse` — so a component never needs a try/catch.
- `"use server"` on every `services/*.services.ts` and every `_action.ts`.
- **Server Component prefetches, Client Component consumes**: `page.tsx` is async, builds a `QueryClient`, `prefetchQuery`s, and wraps the client table in `<HydrationBoundary>`. The query key must match on both sides.
- Feature components live in `src/components/modules/<Domain>/<Feature>/`. `app/` holds only `page.tsx`, `layout.tsx`, `loading.tsx`, `_action.ts` — plus a `route.ts` where the answer is a file rather than a page (e.g. `dashboard/invoices/[kind]/[id]/route.ts` streams PDFs). Keep those under `/dashboard` so `proxy.ts` guards them.
- **Two zod schemas per entity**: `<Verb><Entity>FormZodSchema` (all strings, for `form.Field` validators) and `<Verb><Entity>ServerZodSchema` (coerced, re-validated inside the action).
- After a successful mutation, all six in order: `toast.success` → close dialog → `form.reset()` → `invalidateQueries` → `refetchQueries({ type: "active" })` → `router.refresh()`.
- Route protection is `src/proxy.ts` (Next 16's rename of `middleware.ts`); the route-ownership table lives in `src/lib/authUtils.ts`. `SUPER_ADMIN` gets `/admin/dashboard`; agency roles share `/dashboard`.
- `JWT_ACCESS_SECRET` must equal the backend's `ACCESS_TOKEN_SECRET`, or every protected route silently bounces to `/login`.
- **Never redirect to `/login` just because there is no user.** `getUserInfo()` returns `null` both for "signed out" and "the API did not answer", and redirecting on that made an API outage log everyone out — with `/login` equally broken, since signing in needs the same API. Anything deciding to send someone to `/login` uses `loadSession()` and switches on the outcome: only `unauthenticated` redirects, `unavailable` renders `ServiceUnavailable`. Only the API's own 401/403 ends a session (`src/lib/sessionOutcome.ts`).
- **Pick from a list that grows with the business using `SearchableSelect`** (`components/shared/form`), with its options from `src/lib/pickerOptions.ts` — customers, suppliers, employees, airlines, routes, visa agents. A plain `Select` made an agency with hundreds of customers scroll through all of them to sell one ticket. Short fixed lists (accounts, categories, statuses) stay `Select`. Its popover is `modal`: inside a Dialog a non-modal one cannot be wheel-scrolled.
- shadcn primitives in `src/components/ui/` are generated — `pnpm dlx shadcn@latest add <name>`, never hand-written.
- Theme: blue `--primary` on white, with four per-module accent tokens — `--visa`, `--hajj`, `--expense`, `--ledger` — exposed to Tailwind as `bg-visa`, `text-hajj` and so on. (The accounts accent is `ledger`, not `balance`: `text-balance` is already a Tailwind core utility for `text-wrap: balance`, so that name would collide.) All defined as CSS variables in `globals.css`. Read the variables — never hard-code hex in a component or a chart, or dark mode breaks.
- Tailwind v4: there is no `tailwind.config.js`. Tokens live in `@theme inline`.
- **Charts** use `@/components/ui/chart` (Recharts 3). Colour series with `var(--chart-1…5)` in the `ChartConfig` and pass `tick={AXIS_TICK}` (`components/modules/Dashboard/Home/chartTheme.ts`) on every axis: the generated primitive's tick override targets a class Recharts 3 renamed, so without it axis text stays a hard-coded `#666` and is unreadable in dark mode. A numeric axis that can go negative needs a domain that includes zero, or Recharts clips the loss. Keep data shaping in a pure `src/lib` module with tests (see `dashboardCharts.ts`).
- **Content-Security-Policy is on.** `proxy.ts` sends a per-request nonce policy (`src/lib/securityHeaders.ts`): no inline scripts or event handlers without the nonce, no `eval`, the browser may only connect to this app. Never add `dangerouslySetInnerHTML` scripts, `onclick="…"` strings, or client-side calls to other origins. A `<Script>` or a library that injects one needs the nonce from `headers().get("x-nonce")`.
- **Never `console.*` and never log a raw error** (lint-enforced). Everything goes through `@/lib/logger`, and a failed API call is described with `describeApiFailure(error)` from `@/lib/apiError`. An axios error carries `config.headers`, and this app forwards the browser's whole cookie jar to the API — logging the error object printed live session tokens into the server log. Server-side render failures are reported by `src/instrumentation.ts`, which files them under the same `digest` the error page shows the user.
- **Import zod from `@/lib/zod`, never `"zod"`** (lint-enforced). It turns off zod's `eval` probe, which the CSP would otherwise report on every page.
- **Every mutation payload type must match the API schema that validates it, key for key.** The API's zod objects strip unknown keys, so a misnamed field is not an error — it is silently dropped. `pnpm check:contract` (`scripts/check-api-contract.mjs`) pairs each `httpClient.post/put/patch` in `src/services` with its API route by method and path and compares the payload's declared type with the route's schema; CI runs it against the API's main branch. Give a service's payload parameter a named type from `src/types` so the check can read it.
- **Some files copy API rules so the UI can disable what the API would refuse.** The API stays the authority; when its rule changes, update the copy and its test:
  - `src/lib/navItem.ts` `feature` ↔ each router's `checkFeatureAccess`
  - `src/lib/teamPermissions.ts` ↔ `TeamService.assertCanManage`
  - `src/zod/auth.validation.ts` ↔ the API's password and token bounds
- **The server's query string must match the browser's `searchParams.toString()` byte for byte** (`src/lib/queryString.ts`). It is the React Query key on both sides, so any difference silently drops the prefetch.
