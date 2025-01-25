"use client";

import { env } from "@/lib/env";
import { PostHogProvider } from "posthog-js/react";

export function PhProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider
      apiKey={env.NEXT_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: "/ingest",
        ui_host: env.NEXT_PUBLIC_SITE_URL,
        person_profiles: "always",
      }}
    >
      {children}
    </PostHogProvider>
  );
}
