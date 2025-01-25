import { IsTouchscreenProvider } from "@/components/providers/is-touchscreen-provider";
import NavigationHistoryProvider from "@/components/providers/navigation-history-provider";
import { PhProvider } from "@/components/providers/ph-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TRPCReactProvider } from "@/server/trpc/setup/react";
import { Provider as JotaiProvider } from "jotai";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React from "react";

export default async function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PhProvider>
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
    </PhProvider>
  );
}
