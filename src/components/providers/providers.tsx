import { TRPCReactProvider } from "@/server/trpc/setup/react";
import React from "react";
import { Provider as JotaiProvider } from "jotai";
import { IsTouchscreenProvider } from "@/components/providers/is-touchscreen-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import NavigationHistoryProvider from "@/components/providers/navigation-history-provider";
import PlausibleProvider from "next-plausible";
import { env } from "@/lib/env";

const domain = new URL(env.NEXT_PUBLIC_SITE_URL).hostname;

export default async function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PlausibleProvider
      domain={domain}
      customDomain={env.NEXT_PUBLIC_PLAUSIBLE_URL}
      selfHosted={true}
      trackOutboundLinks={true}
      trackFileDownloads={true}
      taggedEvents={true}
    >
      <JotaiProvider>
        <NuqsAdapter>
          <ThemeProvider>
            <TRPCReactProvider>
              <IsTouchscreenProvider>
                <NavigationHistoryProvider />
                {children}
              </IsTouchscreenProvider>
            </TRPCReactProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </JotaiProvider>
    </PlausibleProvider>
  );
}
