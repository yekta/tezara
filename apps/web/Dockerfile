# Build context is the REPO ROOT (the pnpm workspace + lockfile live there).
#   Coolify: Build Pack = Dockerfile, Base Directory = /, Dockerfile = /apps/web/Dockerfile
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# --- isolate just this app's slice of the workspace -------------------------
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2 prune @tezara/web --docker

# --- install + build --------------------------------------------------------
FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# turbo prune copies package manifests and package directories, but NOT arbitrary root
# files. Every package tsconfig does `extends: "../../tsconfig.base.json"`, and without
# it tsc silently falls back to compiler defaults — no esModuleInterop, no skipLibCheck —
# which fails the build on third-party .d.ts files.
COPY --from=pruner /app/tsconfig.base.json ./
# Next inlines NEXT_PUBLIC_* into the client bundle at BUILD time, so these must be the
# real values — a placeholder here ships a broken bundle. Coolify: set them as build args.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MEILI_URL
ARG NEXT_PUBLIC_MEILI_CLIENT_KEY
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_POSTHOG_HOST_ASSETS
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_MEILI_URL=$NEXT_PUBLIC_MEILI_URL \
    NEXT_PUBLIC_MEILI_CLIENT_KEY=$NEXT_PUBLIC_MEILI_CLIENT_KEY \
    NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST \
    NEXT_PUBLIC_POSTHOG_HOST_ASSETS=$NEXT_PUBLIC_POSTHOG_HOST_ASSETS

# The sitemap routes QUERY Meilisearch during page-data collection, so the build needs a
# genuinely reachable instance — not just a syntactically valid URL. On Coolify that
# means the build must run on the network that can see Meili.
ARG MEILI_URL_INTERNAL=http://build.invalid
ARG MEILI_ADMIN_KEY=build
ARG CLICKHOUSE_URL=http://build.invalid
ARG CLICKHOUSE_USERNAME=build
ARG CLICKHOUSE_PASSWORD=build
ARG REDIS_URL=redis://build.invalid:6379
ENV SKIP_ENV_VALIDATION=1 \
    MEILI_URL_INTERNAL=$MEILI_URL_INTERNAL \
    MEILI_ADMIN_KEY=$MEILI_ADMIN_KEY \
    CLICKHOUSE_URL=$CLICKHOUSE_URL \
    CLICKHOUSE_USERNAME=$CLICKHOUSE_USERNAME \
    CLICKHOUSE_PASSWORD=$CLICKHOUSE_PASSWORD \
    REDIS_URL=$REDIS_URL \
    POSTHOG_PERSONAL_API_KEY=build \
    POSTHOG_PROJECT_ID=0

RUN pnpm --filter @tezara/web build

# --- runtime ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs
# standalone bundles only the traced deps; public/ and static/ are not included
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
