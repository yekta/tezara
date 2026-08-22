import { request, type APIRequestContext } from "playwright";

const BASE = "https://tez.yok.gov.tr/UlusalTezMerkezi/";

export type Session = {
  api: APIRequestContext;
  throttle: () => Promise<void>;
  close: () => Promise<void>;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * A session is just a JSESSIONID plus a rate gate. No browser is needed — the entire
 * flow works over plain HTTP. Taxonomy tokens (university/institute ids) ARE
 * session-scoped and must never be persisted, but the crawl path uses TezNo, which is
 * a plain integer, so nothing here needs to outlive the session.
 */
export async function openSession(opts: { delayMs?: number } = {}): Promise<Session> {
  const delayMs = opts.delayMs ?? 400;
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

  let last = 0;
  return {
    api,
    throttle: async () => {
      const wait = delayMs - (Date.now() - last);
      if (wait > 0) await sleep(wait);
      last = Date.now();
    },
    close: () => api.dispose(),
  };
}
