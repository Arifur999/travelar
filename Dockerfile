# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Travelar web — production image (Next.js standalone output).
#
#   docker build -t travelar-web .
#   docker run -p 3000:3000 \
#     -e API_BASE_URL=http://api:5050/api/v1 \
#     -e JWT_ACCESS_SECRET=... travelar-web
#
# Nothing environment-specific is baked in: API_BASE_URL and JWT_ACCESS_SECRET
# are read at runtime, so the same image runs against any backend.
# ---------------------------------------------------------------------------

FROM node:24-alpine AS base
# Pinned to the version that wrote pnpm-lock.yaml (package.json#packageManager).
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
WORKDIR /app

# ---- dependencies: cached until the manifest or lockfile changes -----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- build ---------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- runtime: only the traced server, static assets and public files -----
FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# The node image ships an unprivileged `node` user; the server never needs root.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000

# /login is public and server-rendered, so a 200 means the server is up and
# rendering — without needing a session or the API to be reachable.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
