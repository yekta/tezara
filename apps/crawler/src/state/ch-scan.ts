import type { ClickHouseClient } from "@tezara/clickhouse";

export type ScanState = "ok" | "gap" | "error";

export type ScanRecord = {
  state: ScanState;
  lastChecked: number;
  attempts: number;
  contentHash?: string;
};

/**
 * Per-thesis-ID crawl state, in ClickHouse.
 *
 * A `gap` is never final. In-progress theses carry `Tez No: 0` and only get a real id
 * once approved, so an id that is empty today becomes a real thesis later — writing a
 * gap off permanently would silently lose every thesis approved after the first pass.
 * Gaps are therefore rescheduled on a long, decaying interval rather than removed.
 */
export const RECHECK_MS: Record<ScanState, (attempts: number) => number> = {
  // refreshed by tier policy, not here; a long default keeps it out of the way
  ok: () => 30 * 24 * 60 * 60_000,
  // 7d, 14d, 28d … capped at 90d
  gap: (attempts) => Math.min(7 * 2 ** Math.max(0, attempts - 1), 90) * 24 * 60 * 60_000,
  // fast retry: 5m, 10m, 20m … capped at 6h
  error: (attempts) => Math.min(5 * 2 ** Math.max(0, attempts - 1), 360) * 60_000,
};

type StateRow = {
  id: number;
  state: ScanState;
  last_checked: string;
  next_check_at: string;
  attempts: number;
  content_hash: string;
};

/**
 * The crawl's durable marks: which ids were visited, what was found, when to look again.
 *
 * Writes are buffered and flushed as one insert per work unit (ClickHouse wants batches,
 * not row-at-a-time traffic). The crawler is a single process and the sole writer, so a
 * crash simply loses the current buffer — those ids are re-crawled on the next pass,
 * which is the recovery model everywhere in this system: the marks are what matter, the
 * work is repeatable.
 *
 * Reads that must be exact use FINAL; ReplacingMergeTree collapses re-records by id only
 * at merge time. Watermarks are monotonic, so max(value) is exact without FINAL.
 */
export class ChScanStore {
  readonly #ch: ClickHouseClient;
  #buffer: Record<string, unknown>[] = [];
  #pendingWatermarks = new Map<string, number>();
  /** Read-through cache; correct because this process is the only writer. */
  #watermarkCache = new Map<string, number | null>();

  constructor(ch: ClickHouseClient) {
    this.#ch = ch;
  }

  async #rows<T>(query: string, params: Record<string, unknown> = {}): Promise<T[]> {
    const res = await this.#ch.query({ query, query_params: params, format: "JSONEachRow" });
    return res.json<T>();
  }

  static #toRecord(row: StateRow): ScanRecord {
    return {
      state: row.state,
      lastChecked: Number(row.last_checked),
      attempts: row.attempts,
      contentHash: row.content_hash || undefined,
    };
  }

  async get(id: number): Promise<ScanRecord | null> {
    return (await this.getMany([id])).get(id) ?? null;
  }

  async getMany(ids: readonly number[]): Promise<Map<number, ScanRecord>> {
    if (ids.length === 0) return new Map();
    const rows = await this.#rows<StateRow>(
      `SELECT id, state, last_checked, next_check_at, attempts, content_hash
       FROM crawl_state FINAL WHERE id IN {ids:Array(UInt32)}`,
      { ids: [...ids] },
    );
    return new Map(rows.map((r) => [Number(r.id), ChScanStore.#toRecord(r)]));
  }

  /** Which ids in [from, to] have ever been recorded — the backfill's skip list. */
  async recordedInRange(from: number, to: number): Promise<Set<number>> {
    // Existence needs no FINAL: any version of the row proves the id was visited.
    const rows = await this.#rows<{ id: number }>(
      "SELECT DISTINCT id FROM crawl_state WHERE id BETWEEN {from:UInt32} AND {to:UInt32}",
      { from, to },
    );
    return new Set(rows.map((r) => Number(r.id)));
  }

  /**
   * Record an outcome and schedule the next visit. Buffered — call flush() at the end
   * of the work unit. `previous` is the record the caller already fetched (attempts
   * count consecutive non-ok outcomes; a success resets the ladder).
   */
  record(
    id: number,
    state: ScanState,
    opts: { contentHash?: string; previous?: ScanRecord | null; now?: number } = {},
  ): ScanRecord {
    const now = opts.now ?? Date.now();
    const previous = opts.previous ?? null;
    const attempts = state === "ok" ? 0 : (previous?.state === state ? previous.attempts : 0) + 1;
    const next: ScanRecord = { state, lastChecked: now, attempts, contentHash: opts.contentHash };

    this.#buffer.push({
      id,
      state,
      last_checked: now,
      next_check_at: now + RECHECK_MS[state](attempts),
      attempts,
      content_hash: opts.contentHash ?? "",
    });
    return next;
  }

  /** How many records are waiting for a flush. */
  get buffered(): number {
    return this.#buffer.length + this.#pendingWatermarks.size;
  }

  /** Write buffered records and watermark raises. One insert each, at most. */
  async flush(): Promise<number> {
    const rows = this.#buffer;
    const marks = this.#pendingWatermarks;
    this.#buffer = [];
    this.#pendingWatermarks = new Map();

    try {
      if (rows.length > 0) {
        await this.#ch.insert({ table: "crawl_state", values: rows, format: "JSONEachRow" });
      }
      if (marks.size > 0) {
        await this.#ch.insert({
          table: "crawl_watermarks",
          values: [...marks].map(([name, value]) => ({ name, value })),
          format: "JSONEachRow",
        });
      }
    } catch (err) {
      // Put everything back so the next flush retries it; the cache must forget raises
      // that never landed or they would be skipped as already-written forever.
      this.#buffer = rows.concat(this.#buffer);
      for (const [name, value] of marks) {
        const pending = this.#pendingWatermarks.get(name) ?? 0;
        this.#pendingWatermarks.set(name, Math.max(pending, value));
        this.#watermarkCache.delete(name);
      }
      throw err;
    }
    return rows.length;
  }

  /** Ids whose next check is due, soonest first. */
  async due(limit: number, now = Date.now()): Promise<number[]> {
    const rows = await this.#rows<{ id: number }>(
      `SELECT id FROM crawl_state FINAL WHERE next_check_at <= {now:UInt64}
       ORDER BY next_check_at LIMIT {limit:UInt32}`,
      { now, limit },
    );
    return rows.map((r) => Number(r.id));
  }

  async counts(now = Date.now()): Promise<{ tracked: number; due: number }> {
    const rows = await this.#rows<{ tracked: string; due: string }>(
      `SELECT uniqExact(id) AS tracked,
              countIf(next_check_at <= {now:UInt64}) AS due
       FROM crawl_state FINAL`,
      { now },
    );
    return { tracked: Number(rows[0]?.tracked ?? 0), due: Number(rows[0]?.due ?? 0) };
  }

  async watermark(name: string): Promise<number | null> {
    const pending = this.#pendingWatermarks.get(name);
    if (this.#watermarkCache.has(name)) {
      const cached = this.#watermarkCache.get(name)!;
      return pending !== undefined ? Math.max(pending, cached ?? 0) : cached;
    }
    const rows = await this.#rows<{ value: string | null }>(
      "SELECT max(value) AS value FROM crawl_watermarks WHERE name = {name:String}",
      { name },
    );
    const raw = rows[0]?.value;
    const stored = raw === null || raw === undefined || Number(raw) === 0 ? null : Number(raw);
    this.#watermarkCache.set(name, stored);
    if (pending !== undefined) return Math.max(pending, stored ?? 0);
    return stored;
  }

  /** Monotonic: a watermark never moves backwards. Buffered — flush() persists it. */
  async raiseWatermark(name: string, value: number): Promise<number> {
    const current = (await this.watermark(name)) ?? 0;
    if (value <= current) return current;
    this.#pendingWatermarks.set(name, value);
    this.#watermarkCache.set(name, value);
    return value;
  }
}
