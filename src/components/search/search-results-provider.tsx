"use client";

import { AppRouterOutputs, AppRouterQueryResult } from "@/server/trpc/api/root";
import { api } from "@/server/trpc/setup/react";
import { usePathname } from "next/navigation";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import React, { createContext, ReactNode, useContext } from "react";

type TSearchResultsContext = AppRouterQueryResult<
  AppRouterOutputs["main"]["searchTheses"]
> & {
  bulkDownload: () => Promise<AppRouterOutputs["main"]["searchTheses"]>;
};

const STALE_TIME = 60 * 1000;
const SearchResultsContext = createContext<TSearchResultsContext | null>(null);

export const SearchResultsProvider: React.FC<{
  children: ReactNode;
  initialData?: AppRouterOutputs["main"]["searchTheses"];
}> = ({ children, initialData }) => {
  const utils = api.useUtils();
  const pathname = usePathname();
  const isSearchResultsPath = pathname.startsWith("/search");

  const [query] = useQueryState("q", parseAsString.withDefault(""));
  const [languages] = useQueryState(
    "languages",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [universities] = useQueryState(
    "universities",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [thesisTypes] = useQueryState(
    "thesis-types",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const searchThesesQuery = api.main.searchTheses.useQuery(
    {
      query,
      languages: languages && languages.length ? languages : undefined,
      universities:
        universities && universities.length ? universities : undefined,
      thesisTypes: thesisTypes && thesisTypes.length ? thesisTypes : undefined,
    },
    {
      initialData,
      enabled: isSearchResultsPath,
      staleTime: STALE_TIME,
    }
  );
  const bulkDownload: TSearchResultsContext["bulkDownload"] = async () => {
    return utils.main.searchTheses.fetch(
      {
        bulk: true,
        query,
        languages: languages && languages.length ? languages : undefined,
        universities:
          universities && universities.length ? universities : undefined,
        thesisTypes:
          thesisTypes && thesisTypes.length ? thesisTypes : undefined,
      },
      {
        staleTime: STALE_TIME,
      }
    );
  };

  return (
    <SearchResultsContext.Provider
      value={{
        ...searchThesesQuery,
        bulkDownload,
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
