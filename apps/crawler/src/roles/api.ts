import { createServer, type Server, type ServerResponse } from "node:http";
import type { Redis } from "ioredis";
import type { Queue } from "../queue/queue.ts";
import type { Outbox } from "../state/outbox.ts";
import type { ReconcileStore } from "../state/reconcile.ts";
import type { ScanStore } from "../state/scan.ts";
import type { CircuitBreaker } from "../yok/breaker.ts";

export type ApiDeps = {
  redis: Redis;
  queue: Queue;
  scan: ScanStore;
  outbox: Outbox;
  clickhouseOutbox?: Outbox;
  breaker: CircuitBreaker;
  reconcile?: ReconcileStore;
  maxThesisId: number;
};

async function buildStatus(deps: ApiDeps) {
  const [queue, scan, meiliOutbox, clickhouseOutbox, breaker] = await Promise.all([
    deps.queue.stats(),
    deps.scan.counts(),
    deps.outbox.depth(),
    deps.clickhouseOutbox?.depth() ?? Promise.resolve(0),
    deps.breaker.stats(),
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
    queue: {
      pending: queue.pending,
      running: queue.leased,
      dead: queue.dead,
    },
    pendingProjection: {
      // Crawled but not yet indexed. Should hover near zero; a number that only grows
      // means the sync jobs are not running.
      meili: meiliOutbox,
      clickhouse: clickhouseOutbox,
    },
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

    json(res, 404, { error: "not found", routes: ["/health", "/ready", "/metrics"] });
  });
}
