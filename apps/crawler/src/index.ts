/**
 * Role dispatch. One image, three roles (scheduler | worker | api) selected by env.
 * Roles land in Phase 4; Phase 1 only proves the fetch layer works.
 */
const role = process.env.CRAWLER_ROLE ?? "worker";

switch (role) {
  case "scheduler":
  case "worker":
  case "api":
    console.error(`[crawler] role "${role}" is not implemented yet (Phase 4).`);
    console.error(`[crawler] fetch layer is ready — try: pnpm --filter @tezara/crawler probe 109`);
    process.exit(1);
    break;
  default:
    console.error(`[crawler] unknown CRAWLER_ROLE "${role}" (expected scheduler|worker|api)`);
    process.exit(1);
}
