import { Redis } from "ioredis";

export function createRedis(url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379"): Redis {
  const parsed = new URL(url);
  return new Redis({
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: parsed.pathname && parsed.pathname !== "/" ? Number(parsed.pathname.slice(1)) : 0,
    // The crawler must not silently drop writes when Redis blips: queue and scan state
    // are the only durable record of progress.
    maxRetriesPerRequest: 5,
    enableOfflineQueue: true,
  });
}
