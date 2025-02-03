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
  default: {
    ttl: 60 * 60 * 24 * 1,
    revalidate: 60 * 10,
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
        revalidating?: boolean;
      } = JSON.parse(cached);

      if (Date.now() - parsed.timestamp > config.revalidate * 1000) {
        after(async () => {
          if (parsed.revalidating) {
            console.log(`REDIS | CACHE_HIT | 🔵 REVALIDATING_ALREADY | ${key}`);
            return;
          }

          console.log(`REDIS | CACHE_HIT | 🟡 REVALIDATE | ${key}`);

          // Set revalidating right away
          await redis.set(
            key,
            JSON.stringify({
              ...parsed,
              revalidating: true,
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
