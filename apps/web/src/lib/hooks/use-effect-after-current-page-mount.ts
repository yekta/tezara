"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export const useEffectAfterCurrentPageMount: typeof useEffect = (
  effect,
  deps
) => {
  const hasMounted = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    hasMounted.current = false;
  }, [pathname]);

  useEffect(() => {
    if (hasMounted.current) {
      return effect();
    } else {
      hasMounted.current = true;
    }
    // We intentionally omit to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
