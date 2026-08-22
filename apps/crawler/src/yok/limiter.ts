import type { Redis } from "ioredis";
import type { Keys } from "../state/keys.ts";

/**
 * Token bucket shared across every worker via Redis.
 *
 * The point is that the limit is global, not per-process: scaling from one worker to
 * five must not quintuple the load YÖK sees. Refill is computed lazily from elapsed
 * time so there is no background timer to keep alive.
 */
const ACQUIRE_LUA = `
local key      = KEYS[1]
local now      = tonumber(ARGV[1])
local rate     = tonumber(ARGV[2])   -- tokens per second
local capacity = tonumber(ARGV[3])
local want     = tonumber(ARGV[4])

local state  = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(state[1])
local ts     = tonumber(state[2])
if tokens == nil then tokens = capacity; ts = now end

tokens = math.min(capacity, tokens + (now - ts) / 1000 * rate)

if tokens >= want then
  redis.call('HSET', key, 'tokens', tokens - want, 'ts', now)
  return 0
end

redis.call('HSET', key, 'tokens', tokens, 'ts', now)
return math.ceil((want - tokens) / rate * 1000)
`;

export type LimiterOptions = {
  /** Sustained requests per second across all workers. */
  ratePerSecond?: number;
  /** Burst allowance. */
  capacity?: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class RateLimiter {
  readonly #redis: Redis;
  readonly #key: string;
  readonly #rate: number;
  readonly #capacity: number;

  constructor(redis: Redis, keys: Keys, opts: LimiterOptions = {}) {
    this.#redis = redis;
    this.#key = `${keys.prefix}:limiter:yok`;
    // Deliberately slow by default: politeness costs us nothing here.
    this.#rate = opts.ratePerSecond ?? 2;
    this.#capacity = opts.capacity ?? 5;
  }

  /** Milliseconds to wait, 0 if a token was taken. */
  async tryAcquire(tokens = 1): Promise<number> {
    return (await this.#redis.eval(
      ACQUIRE_LUA, 1, this.#key,
      String(Date.now()), String(this.#rate), String(this.#capacity), String(tokens),
    )) as number;
  }

  /** Block until a token is available. */
  async acquire(tokens = 1, signal?: AbortSignal): Promise<void> {
    for (;;) {
      if (signal?.aborted) throw new Error("aborted while waiting for rate limit");
      const wait = await this.tryAcquire(tokens);
      if (wait === 0) return;
      await sleep(Math.min(wait, 1_000));
    }
  }
}
