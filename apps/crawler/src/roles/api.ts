import { createServer, type Server } from "node:http";
import type { Redis } from "ioredis";
import type { Queue } from "../queue/queue.ts";
import type { Outbox } from "../state/outbox.ts";
import type { ScanStore } from "../state/scan.ts";
import type { ReconcileStore } from "../state/reconcile.ts";
import type { CircuitBreaker } from "../yok/breaker.ts";

export type ApiDeps = {
  redis: Redis;
  queue: Queue;
  scan: ScanStore;
  outbox: Outbox;
  breaker: CircuitBreaker;
  reconcile?: ReconcileStore;
};

const escape = (v: string) => v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

function metric(name: string, help: string, type: string, value: number, labels = ""): string {
  return `# HELP ${name} ${help}\n# TYPE ${name} ${type}\n${name}${labels} ${value}\n`;
}

async function renderMetrics(deps: ApiDeps): Promise<string> {
  const [queue, scan, outbox, breaker] = await Promise.all([
    deps.queue.stats(), deps.scan.counts(), deps.outbox.depth(), deps.breaker.stats(),
  ]);
  const head = (await deps.scan.watermark("head")) ?? 0;
  const backfill = (await deps.scan.watermark("backfill")) ?? 0;
  const reconciliations = (await deps.reconcile?.all()) ?? [];
  const totalDrift = reconciliations.reduce((sum, r) => sum + Math.max(0, r.drift), 0);
  const driftingYears = reconciliations.filter((r) => r.drift > 0).length;

  return [
    metric("tezara_queue_jobs", "Jobs by state", "gauge", queue.pending, '{state="pending"}'),
    `tezara_queue_jobs{state="leased"} ${queue.leased}\n`,
    `tezara_queue_jobs{state="dead"} ${queue.dead}\n`,
    metric("tezara_scan_ids_tracked", "Thesis ids with recorded state", "gauge", scan.tracked),
    metric("tezara_scan_ids_due", "Thesis ids due for a re-visit", "gauge", scan.due),
    metric("tezara_outbox_depth", "Theses awaiting projection into Meili", "gauge", outbox),
    metric("tezara_head_watermark", "Highest thesis id known upstream", "gauge", head),
    metric("tezara_backfill_cursor", "Next thesis id the backfill will queue", "gauge", backfill),
    metric("tezara_breaker_failures", "Consecutive upstream failures", "gauge", breaker.failures),
    metric(
      "tezara_breaker_state", "Circuit breaker state (1 = active)", "gauge", 1,
      `{state="${escape(breaker.state)}"}`,
    ),
    metric("tezara_years_reconciled", "Years checked against YÖK's own totals", "gauge", reconciliations.length),
    metric("tezara_reconcile_drift_total", "Records YÖK reports that we do not hold", "gauge", totalDrift),
    metric("tezara_reconcile_years_drifting", "Years where we hold fewer than YÖK reports", "gauge", driftingYears),
  ].join("");
}

export function createApi(deps: ApiDeps): Server {
  return createServer((req, res) => {
    const url = req.url ?? "/";

    if (url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (url === "/ready") {
      // Ready means we can actually reach our own state store.
      deps.redis
        .ping()
        .then(() => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ status: "ready" }));
        })
        .catch((err: unknown) => {
          res.writeHead(503, { "content-type": "application/json" });
          res.end(JSON.stringify({ status: "unready", error: String(err) }));
        });
      return;
    }

    if (url === "/metrics") {
      renderMetrics(deps)
        .then((body) => {
          res.writeHead(200, { "content-type": "text/plain; version=0.0.4" });
          res.end(body);
        })
        .catch((err: unknown) => {
          res.writeHead(500, { "content-type": "text/plain" });
          res.end(String(err));
        });
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });
}
