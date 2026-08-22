# Build context is the REPO ROOT.
#   Coolify: Build Pack = Dockerfile, Base Directory = /, Dockerfile = /apps/crawler/Dockerfile
#
# No Chromium: the whole YÖK flow runs over playwright's APIRequestContext (plain HTTP),
# so we skip the browser download entirely and stay on a ~200MB image.
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2 prune @tezara/crawler --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile --prod=false
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @tezara/crawler typecheck

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/crawler ./apps/crawler
RUN addgroup -g 1001 -S nodejs && adduser -S crawler -u 1001 && chown -R crawler:nodejs /app
USER crawler
ENV CRAWLER_ROLE=worker
EXPOSE 3000
# Node 22 strips TS types natively, so there is no build step to keep in sync.
CMD ["node", "--experimental-strip-types", "apps/crawler/src/index.ts"]
