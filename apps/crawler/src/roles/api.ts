import { createServer, type Server, type ServerResponse } from "node:http";
import type { MeiliSearch } from "@tezara/meili";
import type { Redis } from "ioredis";
import type { Outbox } from "../state/outbox.ts";
import type { ReconcileStore } from "../state/reconcile.ts";
import type { ChScanStore } from "../state/ch-scan.ts";
import type { CircuitBreaker } from "../yok/breaker.ts";

export type ApiDeps = {
  redis: Redis;
  scan: ChScanStore;
  outbox: Outbox;
  breaker: CircuitBreaker;
  reconcile?: ReconcileStore;
  maxThesisId: number;
  /** Only for reporting — the drainers get their own handle. */
  meili?: MeiliSearch;
};

/**
 * Meili's own view of itself: how much disk its database occupies and how much of the
 * corpus it actually holds.
 *
 * Worth the extra call on a status page, because the failure it warns about is silent
 * until it is total: a full volume answers every write with 422 and the outbox simply
 * grows. Never fatal to the status page — an unreachable Meili is itself the answer.
 */
async function meiliStats(client: MeiliSearch | undefined) {
  if (!client) return null;
  try {
    const stats = await client.getStats();
    return {
      databaseSizeBytes: stats.databaseSize,
      indexedTheses: stats.indexes?.theses?.numberOfDocuments ?? 0,
    };
  } catch (err) {
    return { unreachable: err instanceof Error ? err.message : String(err) };
  }
}

export async function buildStatus(deps: ApiDeps) {
  const [scan, meiliOutbox, clickhouseOutbox, meiliDead, breaker, search] =
    await Promise.all([
      deps.scan.counts(),
      deps.outbox.depth("meili"),
      deps.outbox.depth("clickhouse"),
      deps.outbox.deadDepth("meili"),
      deps.breaker.stats(),
      meiliStats(deps.meili),
    ]);

  const head = (await deps.scan.watermark("head")) ?? 0;
  const backfillCursor = (await deps.scan.watermark("backfill")) ?? 1;
  const reconciliations = (await deps.reconcile?.all()) ?? [];
  const drifting = reconciliations.filter((r) => r.drift > 0);

  return {
    crawl: {
      idsVisited: scan.tracked,
      idsDueForRecheck: scan.due,
      backfillCursor,
      maxThesisId: deps.maxThesisId,
      // Where the sequential backfill has reached, not how much of the corpus is held.
      backfillPercent: Number(
        (Math.min(100, (backfillCursor / deps.maxThesisId) * 100)).toFixed(2),
      ),
      highestIdSeenUpstream: head,
    },
    pendingProjection: {
      // Crawled but not yet indexed. Should hover near zero; a number that only grows
      // means the drainers are not keeping up (or a target is down).
      meili: meiliOutbox,
      clickhouse: clickhouseOutbox,
      // Documents Meili refused one at a time. Nothing retries these; a non-zero count
      // is a bug to look at, in `<prefix>:outbox:meili:dead`.
      meiliQuarantined: meiliDead,
    },
    search,
    upstream: {
      breaker: breaker.state,
      consecutiveFailures: breaker.failures,
    },
    reconciliation: {
      yearsChecked: reconciliations.length,
      yearsShort: drifting.length,
      // Records YÖK reports that we do not hold.
      missingRecords: reconciliations.reduce((sum, r) => sum + Math.max(0, r.drift), 0),
      worst: drifting
        .sort((a, b) => b.drift - a.drift)
        .slice(0, 10)
        .map((r) => ({ year: r.year, reported: r.reported, held: r.held, missing: r.drift })),
    },
  };
}

/**
 * Everything that went wrong recently, in one place.
 *
 * Hunting a failure in a hosted log viewer means knowing it happened and roughly when.
 * The quarantine lists are the durable copy: documents a projection target refused.
 */
async function buildFailures(deps: ApiDeps, limit: number) {
  const quarantined = await deps.outbox.dead("meili", limit);
  return {
    quarantined: quarantined.map((q) => ({
      at: q.at,
      reason: q.reason,
      id: (q.doc as { id?: unknown } | null)?.id ?? null,
      title: (q.doc as { title_original?: unknown } | null)?.title_original ?? null,
    })),
  };
}

function json(res: ServerResponse, code: number, body: unknown) {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(`${JSON.stringify(body, null, 2)}\n`);
}

export function createApi(deps: ApiDeps): Server {
  return createServer((req, res) => {
    const path = (req.url ?? "/").split("?")[0];

    if (path === "/health") {
      json(res, 200, { status: "ok" });
      return;
    }

    if (path === "/ready") {
      deps.redis
        .ping()
        .then(() => json(res, 200, { status: "ready" }))
        .catch((err: unknown) => json(res, 503, { status: "unready", error: String(err) }));
      return;
    }

    if (path === "/metrics" || path === "/status" || path === "/") {
      buildStatus(deps)
        .then((body) => json(res, 200, body))
        .catch((err: unknown) => json(res, 500, { error: String(err) }));
      return;
    }

    if (path === "/failures") {
      const limit = Math.min(200, Number(new URL(req.url ?? "/", "http://x").searchParams.get("limit")) || 20);
      buildFailures(deps, limit)
        .then((body) => json(res, 200, body))
        .catch((err: unknown) => json(res, 500, { error: String(err) }));
      return;
    }

    json(res, 404, {
      error: "not found",
      routes: ["/health", "/ready", "/status", "/failures"],
    });
  });
}
