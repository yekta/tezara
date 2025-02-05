import "server-only";

import { env } from "@/lib/env";
import { createClient, type RedisClientType } from "redis";
import { after } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: RedisClientType<any, any, any> | undefined = undefined;

export async function getRedis() {
  if (!client) {
    client = await createClient({
      url: env.REDIS_URL,
    }).connect();
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

const REVALIDATION_WINDOW = 30 * 1000;

export function cacheWithRedis<T>(
  key: string,
  fn: () => Promise<T>,
  cacheDuration: keyof typeof cacheConfig
) {
  const config = cacheConfig[cacheDuration];

  const func = async () => {
    const redis = await getRedis();
    const cached = await redis.get(key);

    if (cached) {
      const parsed: {
        data: T;
        timestamp: number;
        revalidation_started_at?: number;
      } = JSON.parse(cached);

      // Revalidate after the request if required
      if (Date.now() - parsed.timestamp > config.revalidate * 1000) {
        after(async () => {
          if (
            parsed.revalidation_started_at &&
            typeof parsed.revalidation_started_at === "number" &&
            Date.now() - parsed.revalidation_started_at < REVALIDATION_WINDOW
          ) {
            console.log(`REDIS | CACHE_HIT | 🔵 REVALIDATING_ALREADY | ${key}`);
            return;
          }

          console.log(`REDIS | CACHE_HIT | 🟡 REVALIDATE | ${key}`);

          // Set revalidation_started_at right away
          await redis.set(
            key,
            JSON.stringify({
              ...parsed,
              revalidation_started_at: Date.now(),
            }),
            {
              EX: config.ttl,
            }
          );

          const result = await fn();
          const payload = {
            data: result,
            timestamp: Date.now(),
          };

          await redis.set(key, JSON.stringify(payload), {
            EX: config.ttl,
          });
          console.log(`REDIS | CACHE_HIT | 🟢 REVALIDATED | ${key}`);
        });
      } else {
        console.log(`REDIS | CACHE_HIT | NO_REVALIDATE | ${key}`);
      }

      // Return the cached data right away
      return parsed.data;
    }

    console.log(`REDIS | CACHE_MISS | ${key}`);

    const result = await fn();
    const payload = {
      data: result,
      timestamp: Date.now(),
    };
    await redis.set(key, JSON.stringify(payload), {
      EX: config.ttl,
    });

    return result;
  };
  return func;
}
