import "server-only";

import { env } from "@/lib/env";
import { Redis } from "ioredis";
import { after } from "next/server";

let client: Redis | undefined = undefined;
const inFlightCacheFills = new Map<string, Promise<unknown>>();

const parseRedisUrl = (url: string) => {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port),
    username: parsed.username,
    password: parsed.password,
  };
};

export function getRedis() {
  if (!client) {
    const { host, port, username, password } = parseRedisUrl(env.REDIS_URL);
    client = new Redis({
      host,
      port,
      username,
      password,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
  }

  return client;
}

export const cacheConfig = {
  short: {
    ttl: 60 * 60 * 24 * 1,
    revalidate: 60 * 5,
  },
  default: {
    ttl: 60 * 60 * 24 * 1,
    revalidate: 60 * 15,
  },
  long: {
    ttl: 60 * 60 * 24 * 7,
    revalidate: 60 * 60,
  },
} satisfies Record<string, TConfig>;

type TConfig = {
  ttl: number;
  revalidate: number;
};

const REVALIDATION_LOCK_TTL = 60 * 1000;

async function dedupeInFlight<T>(key: string, fn: () => Promise<T>) {
  const existing = inFlightCacheFills.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const task = Promise.resolve().then(fn);
  inFlightCacheFills.set(key, task);

  try {
    return await task;
  } finally {
    if (inFlightCacheFills.get(key) === task) {
      inFlightCacheFills.delete(key);
    }
  }
}

async function setCachedValue(
  redis: Redis,
  key: string,
  payload: unknown,
  ttl: number
) {
  try {
    await redis.set(key, JSON.stringify(payload), "EX", ttl);
  } catch (error) {
    console.error(`REDIS | CACHE_WRITE_FAILED | ${key}`, error);
  }
}

export function cacheWithRedis<T>(
  key: string,
  fn: () => Promise<T>,
  cacheDuration: keyof typeof cacheConfig
) {
  const config = cacheConfig[cacheDuration];

  const func = async () => {
    let redis: Redis;
    let cached: string | null;

    try {
      redis = getRedis();
      cached = await redis.get(key);
    } catch (error) {
      console.error(`REDIS | CACHE_READ_FAILED | ${key}`, error);
      return dedupeInFlight(key, fn);
    }

    if (cached) {
      let parsed: { data: T; timestamp: number };

      try {
        parsed = JSON.parse(cached);
      } catch (error) {
        console.error(`REDIS | CACHE_PARSE_FAILED | ${key}`, error);
        return dedupeInFlight(key, async () => {
          const result = await fn();
          await setCachedValue(
            redis,
            key,
            { data: result, timestamp: Date.now() },
            config.ttl
          );
          return result;
        });
      }

      // Revalidate after the request if required
      if (Date.now() - parsed.timestamp > config.revalidate * 1000) {
        const lockKey = `${key}:revalidation-lock`;
        let lockAcquired = false;

        try {
          lockAcquired =
            (await redis.set(
              lockKey,
              "1",
              "PX",
              REVALIDATION_LOCK_TTL,
              "NX"
            )) === "OK";
        } catch (error) {
          console.error(`REDIS | REVALIDATION_LOCK_FAILED | ${key}`, error);
        }

        if (lockAcquired) {
          after(async () => {
            try {
              console.log(`REDIS | CACHE_HIT | 🟡 REVALIDATE | ${key}`);
              const result = await dedupeInFlight(`revalidate:${key}`, fn);
              await setCachedValue(
                redis,
                key,
                { data: result, timestamp: Date.now() },
                config.ttl
              );
              console.log(`REDIS | CACHE_HIT | 🟢 REVALIDATED | ${key}`);
            } catch (error) {
              console.error(`REDIS | CACHE_REVALIDATE_FAILED | ${key}`, error);
            }
          });
        } else {
          console.log(`REDIS | CACHE_HIT | 🔵 REVALIDATING_ALREADY | ${key}`);
        }
      } else {
        console.log(`REDIS | CACHE_HIT | NO_REVALIDATE | ${key}`);
      }

      // Return the cached data right away
      return parsed.data;
    }

    console.log(`REDIS | CACHE_MISS | ${key}`);

    return dedupeInFlight(key, async () => {
      const result = await fn();
      await setCachedValue(
        redis,
        key,
        { data: result, timestamp: Date.now() },
        config.ttl
      );
      return result;
    });
  };
  return func;
}
