import { readFile } from "node:fs/promises";

const MEMORY_LOG_INTERVAL_MS = 60_000;
const CGROUP_FIELDS = ["anon", "file", "active_file", "inactive_file", "kernel"];

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  setInterval(logMemory, MEMORY_LOG_INTERVAL_MS).unref();
}

async function logMemory() {
  const mb = (bytes: number) => Math.round(bytes / 1048576);
  const { rss, heapTotal, heapUsed, external, arrayBuffers } =
    process.memoryUsage();
  const process_ = `rss=${mb(rss)} heapTotal=${mb(heapTotal)} heapUsed=${mb(heapUsed)} external=${mb(external)} arrayBuffers=${mb(arrayBuffers)}`;

  let cgroup = "";
  try {
    const stat = await readFile("/sys/fs/cgroup/memory.stat", "utf8");
    cgroup = stat
      .split("\n")
      .map((line) => line.split(" "))
      .filter(([key]) => CGROUP_FIELDS.includes(key))
      .map(([key, value]) => `${key}=${mb(Number(value))}`)
      .join(" ");
  } catch {
    cgroup = "cgroup=unavailable";
  }

  console.log(`MEMORY | ${process_} | ${cgroup}`);
}
