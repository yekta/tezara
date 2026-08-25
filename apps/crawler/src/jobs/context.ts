import { foldTr } from "@tezara/core";
import type { ClickHouseClient } from "@tezara/clickhouse";
import type { MeiliSearch } from "@tezara/meili";
import type { DimensionCache } from "../state/dimensions.ts";
import type { Outbox } from "../state/outbox.ts";
import type { ReconcileStore } from "../state/reconcile.ts";
import type { ChScanStore } from "../state/ch-scan.ts";
import type { Lookups } from "../yok/client.ts";
import type { Session } from "../yok/session.ts";
import { fetchSubjectTaxonomy } from "../yok/taxonomy.ts";

export type JobContext = {
  session: Session;
  scan: ChScanStore;
  lookups: Lookups;
  /** One shared payload store with a queue per projection target. */
  outbox: Outbox;
  /**
   * Dimension names already pushed to Meili. Absent just means every name is pushed in
   * every batch, which is what the drain did before it existed.
   */
  dimensions?: DimensionCache;
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
  /**
   * Progress line for work that runs long enough that the job's own completion event is
   * too late to be useful — a full outbox drain takes minutes and would otherwise be
   * silent while it runs.
   */
  log?: (message: string) => void;
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
