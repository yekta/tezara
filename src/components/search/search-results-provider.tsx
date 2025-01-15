"use client";

import { AppRouterOutputs, AppRouterQueryResult } from "@/server/trpc/api/root";
import { api } from "@/server/trpc/setup/react";
import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import React, { createContext, ReactNode, useContext } from "react";

const SearchResultsContext = createContext<TSearchResultsContext | null>(null);

export const SearchResultsProvider: React.FC<{
  children: ReactNode;
  initialData?: AppRouterOutputs["main"]["searchTheses"];
}> = ({ children, initialData }) => {
  const pathname = usePathname();
  const isSearchResultsPath = pathname.startsWith("/search");

  const [query] = useQueryState("q", parseAsString.withDefault(""));
  const searchThesesQuery = api.main.searchTheses.useQuery(
    {
      query,
    },
    {
      initialData,
      enabled: isSearchResultsPath,
    }
  );

  return (
    <SearchResultsContext.Provider
      value={{
        ...searchThesesQuery,
      }}
    >
      {children}
    </SearchResultsContext.Provider>
  );
};

export const useSearchResults = () => {
  const context = useContext(SearchResultsContext);
  if (!context) {
    throw new Error(
      "SearchResultsProvider needs to wrap useSearchResults for it to work."
    );
  }
  return context;
};

export default SearchResultsProvider;

type TSearchResultsContext = AppRouterQueryResult<
  AppRouterOutputs["main"]["searchTheses"]
> & {};
