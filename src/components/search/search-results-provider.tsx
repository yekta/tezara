"use client";

import { LIMIT_DEFAULT, OFFSET_DEFAULT } from "@/components/search/constants";
import { meili } from "@/server/meili/constants-client";
import { searchTheses, TSearchThesesResult } from "@/server/meili/repo/thesis";
import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
} from "nuqs";
import React, { createContext, ReactNode, useContext } from "react";

type TSearchResultsContext = UseQueryResult<TSearchThesesResult> & {
  bulkDownload: () => Promise<TSearchThesesResult>;
};

const LONG_STALE_TIME = 60 * 1000;
const SearchResultsContext = createContext<TSearchResultsContext | null>(null);
const BULK_LIMIT = 20000;

export const SearchResultsProvider: React.FC<{
  children: ReactNode;
  initialData?: TSearchThesesResult;
}> = ({ children, initialData }) => {
  const queryClient = useQueryClient();
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
  const [offset] = useQueryState(
    "offset",
    parseAsInteger.withDefault(OFFSET_DEFAULT)
  );
  const [limit] = useQueryState(
    "limit",
    parseAsInteger.withDefault(LIMIT_DEFAULT)
  );

  const searchThesesQuery = useQuery({
    queryFn: () =>
      searchTheses({
        query,
        languages,
        universities,
        thesisTypes,
        client: meili,
        limit,
        offset,
      }),
    queryKey: getSearchThesesQueryKey({
      query,
      languages,
      universities,
      thesisTypes,
      limit,
      offset,
    }),
    initialData: initialData,
    enabled: isSearchResultsPath,
  });

  const bulkDownload: TSearchResultsContext["bulkDownload"] = async () => {
    return queryClient.fetchQuery({
      queryFn: () =>
        searchTheses({
          query,
          languages,
          universities,
          thesisTypes,
          client: meili,
          limit: BULK_LIMIT,
          offset,
        }),
      queryKey: getSearchThesesQueryKey({
        query,
        languages,
        universities,
        thesisTypes,
        limit: BULK_LIMIT,
        offset,
      }),
      staleTime: LONG_STALE_TIME,
    });
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

function getSearchThesesQueryKey({
  query,
  languages,
  universities,
  thesisTypes,
  limit,
  offset,
}: {
  query: string;
  languages?: string[];
  universities?: string[];
  thesisTypes?: string[];
  limit?: number;
  offset?: number;
}) {
  return [
    query,
    languages && languages.length ? languages : undefined,
    universities && universities.length ? universities : undefined,
    thesisTypes && thesisTypes.length ? thesisTypes : undefined,
    limit ? limit : undefined,
    offset ? offset : undefined,
  ];
}

export default SearchResultsProvider;
