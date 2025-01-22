"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";

export type TNavigationHistory = {
  previousPath: string | null;
};

const NavigationHistoryContext =
  createContext<TNavigationHistoryContext | null>(null);

export const NavigationHistoryProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const previousPath = usePreviousRoute();
  return (
    <NavigationHistoryContext.Provider value={{ previousPath }}>
      {children}
    </NavigationHistoryContext.Provider>
  );
};

export const useNavigationHistory = () => {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error(
      "NavigationHistoryProvider needs to wrap useNavigationHistory for it to work."
    );
  }
  return context;
};

export default NavigationHistoryProvider;

type TNavigationHistoryContext = TNavigationHistory;

const usePreviousRoute = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsStr = searchParams.toString();

  const currentFullPath = getFullPath(pathname, searchParamsStr);
  const ref = useRef<string | null>(null);

  useEffect(() => {
    ref.current = getFullPath(pathname, searchParamsStr);
  }, [pathname, searchParamsStr]);

  return currentFullPath === ref.current ? null : ref.current;
};

function getFullPath(pathname: string, searchParamsStr: string) {
  return pathname + (searchParamsStr ? `?${searchParamsStr}` : "");
}
