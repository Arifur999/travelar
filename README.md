# travelar

Travelar — multi-tenant B2B travel agency management platform.
Next.js 16 App Router + TypeScript + TanStack (Query / Form / Table v9) + shadcn/ui + Tailwind v4.

The API lives in [travelar_backend](https://github.com/Arifur999/travelar_backend).

## What's in it

Each travel agency is a tenant with its own workspace. The platform operator
runs a separate console.

**Agency workspace** — `/dashboard`, for `AGENCY_ADMIN` and `AGENCY_STAFF`

| Area | Pages | Plan feature |
|---|---|---|
| Overview | Dashboard, Goals | — |
| | Reports | `REPORTS` |
| Sales | Tickets (payments, date changes, refunds, PDF invoice) | `TICKETING` |
| | Visa cases (documents, status, payments, PDF invoice) | `VISA` |
| | Hajj & Umrah (packages, batches, rooms, bookings, PDF invoice) | `HAJJ_UMRAH` |
| People | Customers (with a full statement), Collections | — |
| | Suppliers, Supplier payments, Employees¹ | `EXPENSE` |
| Money | Cash accounts, Transfers, Expenses, Capital¹ | `EXPENSE` |
| Setup | Airlines, Routes | `TICKETING` |
| | Team, Agency profile¹ | — |
| Account | Billing¹ (SSLCommerz), Support, Announcements | — |

¹ admins only. Locked modules stay visible in the sidebar, greyed out, and link
to Billing. Everything is unlocked during the trial.

**Platform console** — `/admin/dashboard`, for `SUPER_ADMIN`: overview and MRR,
agencies (status, plan, trial), plans, the support inbox, announcements and an
activity log.

## Run it

```bash
pnpm install
cp .env.example .env.local     # then fill in the values
pnpm dev                       # http://localhost:3000
```

Needs the backend running (see its README). Then register an agency at
`/register`, or sign in as the operator the backend seeds on first boot.
Forgotten passwords are recovered at `/forgot-password`; locally, with no SMTP
configured, the reset link is printed to the API's console.

| Variable | What it is |
|---|---|
| `API_BASE_URL` | Backend base URL **including** `/api/v1`. Server-only, read at runtime. |
| `JWT_ACCESS_SECRET` | Must be the **exact** value of the backend's `ACCESS_TOKEN_SECRET`. A mismatch shows no error — every protected page just bounces to `/login`. |
| `NEXT_PUBLIC_SITE_URL` | This app's own public URL. |

| Script | |
|---|---|
| `pnpm dev` | Dev server (webpack) |
| `pnpm build` | Production build (standalone output) |
| `pnpm lint` | ESLint |

## How it talks to the API

- **Only the server calls the API.** Server Components prefetch into TanStack
  Query and hydrate the client; mutations go through server actions
  (`_action.ts`). The browser never sees the API address or its tokens.
- **Auth** is three httpOnly cookies set on this origin from the login
  response. `src/proxy.ts` (Next 16's middleware) verifies the access token,
  refreshes it when close to expiry, routes each role to its own area, and
  sends anyone holding a temporary password to `/change-password`.
- **Tables are URL-driven.** Page, size, sort, search and filters live in the
  query string, so a filtered view is a shareable link and the server renders
  it already filtered.
- The client's address is forwarded to the API in `X-Forwarded-For`, because
  the API rate-limits logins per address and would otherwise see only this
  server's.

## Production image

```bash
docker build -t travelar-web .
docker run -p 3000:3000 -e API_BASE_URL=... -e JWT_ACCESS_SECRET=... travelar-web
```

Built from Next's standalone output and runs as a non-root user. Nothing is
baked in at build time: the API address and JWT secret are runtime env, so one
image serves any environment. To run the whole stack (Postgres, migrations,
API and this app) with one command, see *Run the full stack in Docker* in the
[backend README](https://github.com/Arifur999/travelar_backend#run-the-full-stack-in-docker).

## Structure

```
src/
  proxy.ts                       route protection, token refresh, role routing
  app/
    layout.tsx                   fonts, providers, Toaster
    globals.css                  Tailwind v4 theme tokens (incl. module accents)
    (authLayout)/                login, register, forgot-password, reset-password
    (dashboardLayout)/
      dashboard/<feature>/       agency workspace: page, loading, _action
      dashboard/invoices/[kind]/[id]/route.ts
                                 streams a PDF invoice from the API
      admin/dashboard/<feature>/ platform console
      billing/payment-result/    where the payment gateway returns
      my-profile/  change-password/
  components/
    ui/                          shadcn primitives (generated — don't hand-edit)
    shared/                      DataTable, filters, pagination, AppField,
                                 cells, ConfirmDialog, StatsCard, Loader
    modules/<Domain>/<Feature>/  tables, form modals, detail sheets
  hooks/                         URL-driven table state, row-action modals
  lib/
    axios/httpClient.ts          server-side API client
    table/features.ts            the TanStack Table v9 feature set
    authUtils.ts navItem.ts      route ownership, sidebar + feature gates
    format.ts queryString.ts     money/date formatting, query serialization
  services/<feature>.services.ts "use server" API calls
  types/<feature>.types.ts       API shapes and enum label/tone maps
  zod/<feature>.validation.ts    form schema + server schema per entity
```

## Docs

- `AGENTS.md` — coding rules for this repo (`CLAUDE.md` just imports it)
- `.env.example` — every env var, with what it's for
