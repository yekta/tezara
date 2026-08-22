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
ARG SKIP_ENV_VALIDATION=1
ENV SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION
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
