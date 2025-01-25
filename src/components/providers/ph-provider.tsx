"use client";

import { env } from "@/lib/env";
import posthog, { PostHog } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

if (
  typeof window !== "undefined" &&
  env.NEXT_PUBLIC_POSTHOG_KEY &&
  env.NEXT_PUBLIC_POSTHOG_HOST
) {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: env.NEXT_PUBLIC_SITE_URL,
  });
}

export function PhProvider({ children }: { children: React.ReactNode }) {
  if (!env.NEXT_PUBLIC_POSTHOG_KEY || !env.NEXT_PUBLIC_POSTHOG_HOST) {
    return children;
  }
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

export const capture: PostHog["capture"] = (...params) => {
  if (!env.NEXT_PUBLIC_POSTHOG_KEY || !env.NEXT_PUBLIC_POSTHOG_HOST)
    return undefined;
  return posthog.capture(...params);
};

export const identify: PostHog["identify"] = (...params) => {
  if (!env.NEXT_PUBLIC_POSTHOG_KEY || !env.NEXT_PUBLIC_POSTHOG_HOST) return;
  posthog.identify(...params);
};
