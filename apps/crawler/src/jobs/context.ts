import { foldTr } from "@tezara/core";
import type { ClickHouseClient } from "@tezara/clickhouse";
import type { MeiliSearch } from "@tezara/meili";
import type { Outbox } from "../state/outbox.ts";
import type { ReconcileStore } from "../state/reconcile.ts";
import type { Queue } from "../queue/queue.ts";
import type { ScanStore } from "../state/scan.ts";
import type { Lookups } from "../yok/client.ts";
import type { Session } from "../yok/session.ts";
import { fetchSubjectTaxonomy } from "../yok/taxonomy.ts";

export type JobContext = {
  session: Session;
  queue: Queue;
  scan: ScanStore;
  lookups: Lookups;
  /** One outbox per projection target; each drains independently. */
  outbox: Outbox;
  clickhouseOutbox?: Outbox;
  /** Absent when running a crawl-only worker with no projection target. */
  meili?: MeiliSearch;
  clickhouse?: ClickHouseClient;
  /** Per-year drift tracking. */
  reconcile?: ReconcileStore;
  /**
   * How many theses we hold for a year. Injected rather than hard-wired to ClickHouse so
   * reconciliation still works on a Meili-only deployment.
   */
  countHeldForYear?: (year: number) => Promise<number>;
};

/**
 * Subject Tr→En pairs come from tarama.jsp and are needed for every record, so they are
 * resolved once per process rather than per thesis. Codes are stable integers; unlike
 * university tokens they are safe to hold for the life of a session.
 */
export async function buildLookups(session: Session): Promise<Lookups> {
  const subjects = await fetchSubjectTaxonomy(session);
  return {
    subjectEnByTr: new Map(subjects.map((s) => [foldTr(s.tr), s.en])),
    universityCanon: new Map(),
  };
}
