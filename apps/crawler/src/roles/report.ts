import type { WorkUnit } from "./loop.ts";

/**
 * Turns unit results into lines a human can read at 3am.
 *
 * The raw `{"ok":50,"gap":0,"error":0}` a unit returns says nothing about *which* work
 * it was, how long it took, or whether the number is good — and those are the only
 * three questions anyone asks of a crawler log.
 */

const n = (value: number) => value.toLocaleString("en-US");

function secs(ms: number): string {
  if (ms < 1_000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m${Math.round((ms % 60_000) / 1_000)}s`;
}

/** Best-effort field read off a unit result, which is typed as unknown by the loop. */
const field = <T>(detail: unknown, key: string): T | undefined =>
  (detail as Record<string, T> | null | undefined)?.[key];

function crawlCounts(detail: unknown): string {
  const ok = field<number>(detail, "ok") ?? 0;
  const gap = field<number>(detail, "gap") ?? 0;
  const err = field<number>(detail, "error") ?? 0;
  const skipped = field<number>(detail, "skipped") ?? 0;
  const unchanged = field<number>(detail, "unchanged") ?? 0;
  const parts = [`${ok} crawled`];
  // A gap is a thesis id YÖK has no record for — normal, and not a failure.
  if (gap) parts.push(`${gap} absent upstream`);
  if (skipped) parts.push(`${skipped} already held`);
  if (unchanged) parts.push(`${unchanged} unchanged`);
  if (err) parts.push(`${err} FAILED`);
  return parts.join(", ");
}

/** A line for this result, or null when the unit did nothing worth saying. */
function describeDetail(unit: WorkUnit, detail: unknown): string | null {
  switch (unit.kind) {
    case "backfill":
      return `ids ${n(unit.from)}..${n(unit.to)}: ${crawlCounts(detail)}`;

    case "refresh":
      return `refresh ${unit.ids.length} due id(s): ${crawlCounts(detail)}`;

    case "discover-head": {
      const found = field<number>(detail, "found") ?? 0;
      const watermark = field<number>(detail, "watermark") ?? 0;
      return found === 0
        ? `no new ids past ${n(watermark)}`
        : `${found} new id(s), head now ${n(watermark)}`;
    }

    case "reconcile-year": {
      const unavailable = field<string>(detail, "reason");
      const year = unit.year;
      if (unavailable) return `year ${year}: could not check — ${unavailable}`;
      const reported = field<number>(detail, "reported") ?? 0;
      const held = field<number>(detail, "held") ?? 0;
      const drift = field<number>(detail, "drift") ?? 0;
      return drift > 0
        ? `year ${year}: YÖK has ${n(reported)}, we hold ${n(held)} — missing ${n(drift)}`
        : `year ${year}: complete (${n(held)} of ${n(reported)})`;
    }

    case "reconcile-projections": {
      const ch = field<number>(detail, "missingInClickhouse") ?? 0;
      const meili = field<number>(detail, "missingInMeili") ?? 0;
      const unscanned = field<number>(detail, "unscanned") ?? 0;
      if (ch === 0 && meili === 0 && unscanned === 0) return "projections complete";
      return (
        `projection reconcile re-queued: ${n(ch)} missing in clickhouse, ` +
        `${n(meili)} missing in meili, ${n(unscanned)} never scanned`
      );
    }
  }
}

export function describeUnit(
  unit: WorkUnit,
  outcome: "ok" | "error",
  detail: unknown,
  elapsedMs: number,
): string | null {
  if (outcome === "ok") {
    const described = describeDetail(unit, detail);
    return described === null ? null : `${described} [${secs(elapsedMs)}]`;
  }
  const what =
    unit.kind === "backfill" ? `backfill ${n(unit.from)}..${n(unit.to)}`
    : unit.kind === "refresh" ? `refresh of ${unit.ids.length} id(s)`
    : unit.kind;
  return `${what} failed after ${secs(elapsedMs)}: ${String(detail)}`;
}

/** A line for a drain result, or null for the steady state (nothing pushed, none left). */
export function describeDrain(target: "meili" | "clickhouse", detail: unknown): string | null {
  if (field<string>(detail, "skipped")) return null;
  const remaining = field<number>(detail, "remaining") ?? 0;
  const pushed = field<number>(detail, "pushed") ?? 0;
  const rebuilt = field<string[]>(detail, "rebuilt") ?? [];
  if (pushed === 0 && remaining === 0 && rebuilt.length === 0) return null;
  const batches = field<number>(detail, "batches") ?? 0;
  const quarantined = field<number>(detail, "quarantined");
  const parts = [`${target}: indexed ${n(pushed)} in ${batches} batch(es)`];
  parts.push(`${n(remaining)} left`);
  if (quarantined) parts.push(`${n(quarantined)} QUARANTINED`);
  if (rebuilt.length > 0) parts.push(`rebuilt ${rebuilt.length} aggregate table(s)`);
  const held = field<string>(detail, "rebuildHeld");
  if (held) parts.push(`aggregates stale (${held})`);
  return parts.join(", ");
}

function bytes(value: number): string {
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)}GB`;
  if (value >= 1024 ** 2) return `${Math.round(value / 1024 ** 2)}MB`;
  return `${Math.round(value / 1024)}KB`;
}

export type CrawlerStatus = {
  crawl: { backfillCursor: number; maxThesisId: number; backfillPercent: number; idsDueForRecheck: number };
  pendingProjection: { meili: number; clickhouse: number; meiliQuarantined: number };
  upstream: { breaker: string; consecutiveFailures: number };
  reconciliation: { yearsShort: number; missingRecords: number };
  search: { databaseSizeBytes?: number; indexedTheses?: number; unreachable?: string } | null;
};

/**
 * The one line that answers "is it working?" — logged on a timer, because a log made of
 * nothing but per-unit lines never shows the totals that actually matter.
 */
export function describeStatus(status: CrawlerStatus, crawledLastMinute: number): string {
  const { crawl, pendingProjection: outbox, upstream } = status;
  const parts = [
    `backfill ${n(crawl.backfillCursor)}/${n(crawl.maxThesisId)} (${crawl.backfillPercent}%)`,
    `${n(crawledLastMinute)} ids/min`,
    `${n(crawl.idsDueForRecheck)} due`,
    `outbox meili ${n(outbox.meili)}, clickhouse ${n(outbox.clickhouse)}`,
  ];
  if (status.search?.unreachable) {
    parts.push(`MEILI UNREACHABLE: ${status.search.unreachable}`);
  } else if (status.search) {
    parts.push(
      `meili ${n(status.search.indexedTheses ?? 0)} indexed` +
        `, ${bytes(status.search.databaseSizeBytes ?? 0)} on disk`,
    );
  }
  if (outbox.meiliQuarantined) {
    parts.push(`${n(outbox.meiliQuarantined)} QUARANTINED DOCS (see /failures)`);
  }
  if (upstream.breaker !== "closed") {
    parts.push(`upstream breaker ${upstream.breaker} after ${upstream.consecutiveFailures} failures`);
  }
  if (status.reconciliation.missingRecords) {
    parts.push(`${n(status.reconciliation.missingRecords)} records short of YÖK`);
  }
  return `status — ${parts.join(" · ")}`;
}
