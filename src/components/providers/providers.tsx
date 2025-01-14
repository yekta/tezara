import { TRPCReactProvider } from "@/server/trpc/setup/react";
import React from "react";

import { IsTouchscreenProvider } from "@/components/providers/is-touchscreen-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default async function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <NuqsAdapter>
      <ThemeProvider>
        <TRPCReactProvider>
          <IsTouchscreenProvider>{children}</IsTouchscreenProvider>
        </TRPCReactProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}
