export const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetch with a real abort signal. Some SDK-level timeouts only reject their
 * wrapper promise and leave the underlying request alive.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const signal = init.signal;
  const abort = () => controller.abort();

  if (signal?.aborted) {
    abort();
  } else {
    signal?.addEventListener("abort", abort, { once: true });
  }

  const timeout = setTimeout(abort, timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
