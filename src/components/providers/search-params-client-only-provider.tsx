"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";

type TSearchParamsClientOnlyContext = {
  searchParams: URLSearchParams;
  searchParamsString: string;
};

const SearchParamsClientOnlyContext =
  createContext<TSearchParamsClientOnlyContext | null>(null);

export function SearchParamsClientOnlyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchParams, setSearchParams] = useState(new URLSearchParams());
  const str = searchParams.toString();
  const searchParamsString = str ? `?${str}` : "";
  const lastUrlRef = useRef(
    typeof window !== "undefined" ? window?.location?.search : ""
  );

  useEffect(() => {
    const setUrl = () => {
      const currentSearch = window.location.search;
      if (currentSearch !== lastUrlRef.current) {
        lastUrlRef.current = currentSearch;
        setSearchParams(new URLSearchParams(currentSearch));
      }
    };

    const observer = new MutationObserver(setUrl);
    observer.observe(document, { subtree: true, childList: true });

    return () => observer.disconnect();
  }, []);

  const value = useMemo(
    () => ({ searchParams, searchParamsString }),
    [searchParams, searchParamsString]
  );

  return (
    <SearchParamsClientOnlyContext.Provider value={value}>
      {children}
    </SearchParamsClientOnlyContext.Provider>
  );
}

export function useSearchParamsClientOnly() {
  const context = useContext(SearchParamsClientOnlyContext);
  if (!context) {
    throw new Error(
      "SearchParamsClientOnlyProvider needs to wrap useSearchParamsClientOnly for it to work."
    );
  }
  return [context.searchParams, context.searchParamsString] as const;
}
