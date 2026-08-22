import "server-only";

/**
 * True while `next build` is collecting page data.
 *
 * Sitemaps, pages and opengraph images fetch from Meilisearch and ClickHouse at build
 * time, but on Unbind (and most PaaS builders) the private service network does not exist
 * during the build — internal hostnames do not resolve. So the build has to reach those
 * services over a publicly routable address, while runtime keeps using the private one.
 */
export const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
