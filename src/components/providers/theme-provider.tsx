"use client";

import {
  defaultTheme,
  metaTheme,
  themes,
  TThemeWithoutSystem,
} from "@/components/providers/themes";
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
  useTheme,
} from "next-themes";
import * as React from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      themes={themes}
      defaultTheme={defaultTheme}
      disableTransitionOnChange
      {...props}
    >
      <ThemeProviderInner>{children}</ThemeProviderInner>
    </NextThemesProvider>
  );
}

function ThemeProviderInner({ children }: { children: React.ReactNode }) {
  const { theme, systemTheme } = useTheme();
  const finalTheme: TThemeWithoutSystem =
    (theme === "system" ? systemTheme : (theme as TThemeWithoutSystem)) ||
    defaultTheme;

  React.useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", metaTheme[finalTheme]);
    }
  }, [finalTheme]);
  return children;
}
