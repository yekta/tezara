import { request, type APIRequestContext } from "playwright";
import { delayGate, type Gate } from "./gate.ts";

const BASE = "https://tez.yok.gov.tr/UlusalTezMerkezi/";

export type Session = {
  api: APIRequestContext;
  /** Call before every outbound request: enforces rate limit and circuit breaker. */
  throttle: (signal?: AbortSignal) => Promise<void>;
  /** Report the outcome so the breaker can open or reset. */
  settle: (ok: boolean) => Promise<void>;
  close: () => Promise<void>;
};

/**
 * A session is just a JSESSIONID plus a rate gate. No browser is needed — the entire
 * flow works over plain HTTP. Taxonomy tokens (university/institute ids) ARE
 * session-scoped and must never be persisted, but the crawl path uses TezNo, which is
 * a plain integer, so nothing here needs to outlive the session.
 */
export async function openSession(
  opts: { delayMs?: number; gate?: Gate } = {},
): Promise<Session> {
  const gate = opts.gate ?? delayGate(opts.delayMs ?? 400);
  const api = await request.newContext({
    baseURL: BASE,
    ignoreHTTPSErrors: true,
    timeout: 120_000,
    extraHTTPHeaders: {
      "User-Agent": "Mozilla/5.0 (compatible; tezara-crawler/1.0; +https://tezara.org)",
      "Accept-Language": "tr-TR,tr;q=0.9",
    },
  });
  await api.get("tarama.jsp");

  return {
    api,
    throttle: (signal) => gate.before(signal),
    settle: (ok) => gate.after(ok),
    close: () => api.dispose(),
  };
}
