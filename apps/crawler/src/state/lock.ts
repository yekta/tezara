import type { Redis } from "ioredis";

/** Extend only while we still hold it, so a lapsed lock is never stolen back. */
const RENEW_LUA = `
if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('PEXPIRE', KEYS[1], ARGV[2]) end
return 0`;

const RELEASE_LUA = `
if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end
return 0`;

/**
 * Run `fn` only if nobody else is running it, and skip otherwise.
 *
 * Returns null when the lock was already held — the caller decides whether that is a
 * no-op or an error. The lock is renewed while `fn` runs, so a long job cannot lose it
 * halfway; a crashed holder's lock simply expires.
 */
export async function withLock<T>(
  redis: Redis,
  key: string,
  fn: () => Promise<T>,
  opts: { ttlMs?: number } = {},
): Promise<T | null> {
  const ttlMs = opts.ttlMs ?? 60_000;
  const token = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`;

  if ((await redis.set(key, token, "PX", ttlMs, "NX")) !== "OK") return null;

  const heartbeat = setInterval(() => {
    void redis.eval(RENEW_LUA, 1, key, token, String(ttlMs)).catch(() => {});
  }, Math.floor(ttlMs / 3));

  try {
    return await fn();
  } finally {
    clearInterval(heartbeat);
    await redis.eval(RELEASE_LUA, 1, key, token).catch(() => {});
  }
}
