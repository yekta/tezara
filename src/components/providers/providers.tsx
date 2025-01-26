import { IsTouchscreenProvider } from "@/components/providers/is-touchscreen-provider";
import { PhProvider } from "@/components/providers/ph-provider";
import { SearchParamsClientOnlyProvider } from "@/components/providers/search-params-client-only-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TRPCReactProvider } from "@/server/trpc/setup/react";
import { Provider as JotaiProvider } from "jotai";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React from "react";

export default async function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SearchParamsClientOnlyProvider>
      <PhProvider>
        <JotaiProvider>
          <NuqsAdapter>
            <ThemeProvider>
              <TRPCReactProvider>
                <IsTouchscreenProvider>{children}</IsTouchscreenProvider>
              </TRPCReactProvider>
            </ThemeProvider>
          </NuqsAdapter>
        </JotaiProvider>
      </PhProvider>
    </SearchParamsClientOnlyProvider>
  );
}
