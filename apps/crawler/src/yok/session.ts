import { request, type APIRequestContext, type APIResponse } from "playwright";
import { delayGate, type Gate } from "./gate.ts";

const BASE = "https://tez.yok.gov.tr/UlusalTezMerkezi/";

export type Session = {
  /**
   * The raw context. Prefer `get`/`post` — a response fetched through this must be
   * disposed by the caller, for the reason spelled out on `readAndDispose` below.
   */
  api: APIRequestContext;
  /** GET a path and return the body. */
  get: (path: string) => Promise<string>;
  /** POST a form and return the body. */
  post: (path: string, form: Record<string, string>) => Promise<string>;
  /** Call before every outbound request: enforces rate limit and circuit breaker. */
  throttle: (signal?: AbortSignal) => Promise<void>;
  /** Report the outcome so the breaker can open or reset. */
  settle: (ok: boolean) => Promise<void>;
  close: () => Promise<void>;
};

/**
 * Read a response body and hand Playwright's copy back.
 *
 * This dispose is load-bearing, not tidiness. An APIRequestContext keeps every response
 * body it has ever fetched in an internal map, and `.text()` only reads a copy out of
 * it — the entry is dropped when the response is disposed, or when the whole context
 * is. A lane's context lives as long as the worker, so without this every page stays
 * resident for the life of the process: a SearchTez result page is ~78KB and there are
 * three responses per thesis, so ~84KB an id reaches a 20GB container limit after some
 * 250,000 ids — well inside one backfill pass over the 1.03M id space.
 *
 * The bodies are buffers, so the growth is external memory: it never trips the V8 heap
 * limit and never surfaces as a heap OOM, the container is just killed.
 */
export async function readAndDispose(res: APIResponse): Promise<string> {
  try {
    return await res.text();
  } finally {
    // A dispose that fails means the context is already gone, which the next request
    // reports anyway. It must not turn a successful read into an error.
    await res.dispose().catch(() => {});
  }
}

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
  // Only here for the cookie it sets, but the body is retained all the same.
  await (await api.get("tarama.jsp")).dispose();

  return {
    api,
    get: async (path) => readAndDispose(await api.get(path)),
    post: async (path, form) => readAndDispose(await api.post(path, { form })),
    throttle: (signal) => gate.before(signal),
    settle: (ok) => gate.after(ok),
    close: () => api.dispose(),
  };
}
