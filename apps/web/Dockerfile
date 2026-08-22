# Build context is the REPO ROOT (the pnpm workspace + lockfile live there).
#   Unbind: Build Pack = Dockerfile, Base Directory = /, Dockerfile = /apps/web/Dockerfile
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
# real values — a placeholder here ships a broken bundle. Unbind: set them as build args.
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

# Runtime-only. Never contacted during the build, so placeholders are correct here — the
# real values come from the runtime environment. SKIP_ENV_VALIDATION is what lets these
# through; the vars the build genuinely needs are enforced by the preflight instead.
ARG MEILI_URL_INTERNAL=http://build.invalid
ARG CLICKHOUSE_URL=http://build.invalid
ARG REDIS_URL=redis://build.invalid:6379
ENV SKIP_ENV_VALIDATION=1 \
    MEILI_URL_INTERNAL=$MEILI_URL_INTERNAL \
    CLICKHOUSE_URL=$CLICKHOUSE_URL \
    REDIS_URL=$REDIS_URL \
    POSTHOG_PERSONAL_API_KEY=build \
    POSTHOG_PROJECT_ID=0

# Sitemaps, pages and opengraph images QUERY ClickHouse and Meilisearch during page-data
# collection, so the build needs genuinely reachable instances — not just syntactically
# valid URLs. `scripts/preflight-build.mjs` connects to both and fails the build in seconds
# if either is missing or unreachable, rather than letting Next grind through a 60s
# prerender timeout per page and emit thousands of notFound() pages.
#
# *_URL_BUILD is whatever address the BUILDER can reach. If the builder runs inside the
# cluster, that is just the private service address again — it does not have to be publicly
# routable. Verify with the preflight before assuming either way.
#
# MEILI_URL_BUILD is a plain ARG because it carries no credentials (the admin key is
# separate). The other two DO carry credentials, so a BuildKit secret is preferred: an ARG
# is baked into image history and echoed in build logs, while a mounted secret exists only
# for the lifetime of this RUN.
#
# Not every builder can pass BuildKit secrets, so each falls back to the matching ARG and
# the build says which channel it used. This is not the silent fallback this file used to
# have: it is the SAME value arriving by a different route, and the preflight still refuses
# to build unless it can actually connect with it.
ARG MEILI_URL_BUILD
ARG CLICKHOUSE_URL_BUILD
ARG MEILI_ADMIN_KEY
ENV MEILI_URL_BUILD=$MEILI_URL_BUILD

RUN --mount=type=secret,id=clickhouse_url_build \
    --mount=type=secret,id=meili_admin_key \
    set -eu; \
    read_secret() { \
      if [ -s "/run/secrets/$1" ]; then \
        echo "  $2: BuildKit secret" >&2; cat "/run/secrets/$1"; \
      elif [ -n "${3:-}" ]; then \
        echo "  $2: build ARG (leaks into image history — prefer a secret)" >&2; printf %s "$3"; \
      else \
        echo "  $2: MISSING — no secret id=$1 mounted and no --build-arg given" >&2; \
      fi; \
    }; \
    echo "build credentials:" >&2; \
    CLICKHOUSE_URL_BUILD="$(read_secret clickhouse_url_build CLICKHOUSE_URL_BUILD "${CLICKHOUSE_URL_BUILD:-}")" \
    MEILI_ADMIN_KEY="$(read_secret meili_admin_key MEILI_ADMIN_KEY "${MEILI_ADMIN_KEY:-}")" \
    pnpm --filter @tezara/web build

# --- runtime --- #
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs
# standalone bundles only traced deps; public/ and static/ are not included
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
