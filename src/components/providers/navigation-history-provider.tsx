"use client";

import { previousPathForThesisPageAtom } from "@/lib/store/main";
import { useSetAtom } from "jotai";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

export default function NavigationHistoryProvider() {
  return (
    <Suspense>
      <NavigationHistoryProviderInner />
    </Suspense>
  );
}

function NavigationHistoryProviderInner() {
  const { previousPath, currentPath } = useNavigationHistory();
  const setPreviousPathForThesisPage = useSetAtom(
    previousPathForThesisPageAtom
  );
  const isPreviousPathThesisPage = previousPath?.startsWith("/thesis/");

  useEffect(() => {
    if (isPreviousPathThesisPage) return;
    if (previousPath === currentPath) return;
    setPreviousPathForThesisPage(previousPath);
    // setPreviousPathForThesisPage is a stable function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previousPath, currentPath, isPreviousPathThesisPage]);
  return null;
}

export const useNavigationHistory = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsStr = searchParams.toString();

  const currentPath = getFullPath(pathname, searchParamsStr);
  const ref = useRef<string | null>(null);

  useEffect(() => {
    ref.current = getFullPath(pathname, searchParamsStr);
  }, [pathname, searchParamsStr]);

  return {
    previousPath: currentPath === ref.current ? null : ref.current,
    currentPath,
  };
};

function getFullPath(pathname: string, searchParamsStr: string) {
  const cleanedSearchParamsStr = searchParamsStr
    ? searchParamsStr.replaceAll("%2C", ",")
    : searchParamsStr;
  return (
    pathname + (cleanedSearchParamsStr ? `?${cleanedSearchParamsStr}` : "")
  );
}
