"use client";

import posthog from "posthog-js";
import { env } from "@/lib/env";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PhProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: env.NEXT_PUBLIC_SITE_URL,
      person_profiles: "always",
    });
  }, []);
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
