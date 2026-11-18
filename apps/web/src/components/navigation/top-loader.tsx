"use client";

import { useTheme } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import { useEffect, useState } from "react";

export default function TopLoader() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMounted(true);
    }
  }, []);

  return (
    <NextTopLoader
      zIndex={9999}
      showSpinner={false}
      color="hsl(var(--top-loader))"
      shadow={false}
      height={mounted && resolvedTheme === "dark" ? 2 : 3}
    />
  );
}
