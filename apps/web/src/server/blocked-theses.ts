import "server-only";

import { env } from "@/lib/env";
import { parseBlockedTheses } from "@tezara/core";

const blockedTheses = parseBlockedTheses(env.BLOCKED_THESES);

export function isThesisBlocked(id: number) {
  return blockedTheses.has(id);
}
