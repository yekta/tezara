import { TRPCReactProvider } from "@/server/trpc/setup/react";
import React from "react";
import { Provider as JotaiProvider } from "jotai";
import { IsTouchscreenProvider } from "@/components/providers/is-touchscreen-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import NavigationHistoryProvider from "@/components/providers/navigation-history-provider";

export default async function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
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
  );
}
