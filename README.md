# travelar

Travelar — multi-tenant B2B travel agency management platform.
Next.js 16 App Router + TypeScript + TanStack (Query/Form/Table) + shadcn/ui + Tailwind v4.

The API lives in [travelar_backend](https://github.com/Arifur999/travelar_backend).

## Run it

```bash
pnpm install
cp .env.example .env.local     # then fill in the values
pnpm dev                       # http://localhost:3000
```

Needs the backend running on port 5050 (`API_BASE_URL`). `JWT_ACCESS_SECRET`
here must be the **exact** same value as the backend's `ACCESS_TOKEN_SECRET`.

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
  app/
    layout.tsx                 fonts, providers, Toaster, skip link
    globals.css                Tailwind v4 + theme tokens
    providers/                 QueryProvider, ThemeProvider
    (commonLayout)/            public marketing + (auth)
    (dashboardLayout)/         agency workspace + platform admin
  components/
    ui/                        shadcn primitives (generated)
    shared/                    DataTable, AppField, cells, Loader
    modules/<Domain>/<Feature>/
  hooks/                       table + modal state hooks
  lib/                         httpClient, auth/jwt/token/cookie utils
  services/<feature>.services.ts
  types/<feature>.types.ts
  zod/<feature>.validation.ts
  proxy.ts                     route protection (Next 16 middleware entry)
```

## Docs

- `AGENTS.md` — coding rules for this repo (`CLAUDE.md` just imports it)
- `.env.example` — every env var, with what it's for
