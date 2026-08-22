import "server-only";

/**
 * True while `next build` is collecting page data.
 *
 * Sitemaps and opengraph images fetch from Meilisearch and ClickHouse at build time, but
 * on Railway (and most PaaS builders) the private network does not exist during the
 * build — `*.railway.internal` does not resolve. So the build has to reach those services
 * over a publicly routable address, while runtime keeps using the private one.
 */
export const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
