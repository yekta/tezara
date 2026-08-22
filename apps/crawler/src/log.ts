/**
 * Where the crawler's output goes.
 *
 * Everything it says routinely — a job finishing, a batch landing, a scheduler tick — is
 * progress, not failure. It all used to go to stderr, which makes a log viewer (Railway,
 * Docker, journald) paint a perfectly healthy crawl red and hides the lines that are
 * genuinely wrong. Only problems go to stderr now.
 */
const PREFIX = "[crawler]";

/** Progress: stdout. */
export function info(message: string): void {
  console.log(`${PREFIX} ${message}`);
}

/** Something recoverable went wrong — a retry, a dead-lettered job: stderr. */
export function warn(message: string): void {
  console.warn(`${PREFIX} ${message}`);
}

/** Something is broken: stderr. */
export function error(message: string): void {
  console.error(`${PREFIX} ${message}`);
}
