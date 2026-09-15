<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
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
- shadcn primitives in `src/components/ui/` are generated — `pnpm dlx shadcn@latest add <name>`, never hand-written.
- Theme: blue `--primary` on white, with four per-module accent tokens — `--visa`, `--hajj`, `--expense`, `--ledger` — exposed to Tailwind as `bg-visa`, `text-hajj` and so on. (The accounts accent is `ledger`, not `balance`: `text-balance` is already a Tailwind core utility for `text-wrap: balance`, so that name would collide.) All defined as CSS variables in `globals.css`. Read the variables — never hard-code hex in a component or a chart, or dark mode breaks.
- Tailwind v4: there is no `tailwind.config.js`. Tokens live in `@theme inline`.
- **Content-Security-Policy is on.** `proxy.ts` sends a per-request nonce policy (`src/lib/securityHeaders.ts`): no inline scripts or event handlers without the nonce, no `eval`, the browser may only connect to this app. Never add `dangerouslySetInnerHTML` scripts, `onclick="…"` strings, or client-side calls to other origins. A `<Script>` or a library that injects one needs the nonce from `headers().get("x-nonce")`.
- **Import zod from `@/lib/zod`, never `"zod"`** (lint-enforced). It turns off zod's `eval` probe, which the CSP would otherwise report on every page.
