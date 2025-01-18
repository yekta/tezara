"use client";

import { LIMIT_BULK, LIMIT_DEFAULT } from "@/components/search/constants";
import { searchLikePageParams } from "@/components/search/constants-client";
import { getSearchThesesQueryKey } from "@/components/search/helpers";
import { meili } from "@/server/meili/constants-client";
import { searchTheses, TSearchThesesResult } from "@/server/meili/repo/thesis";
import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import React, { createContext, ReactNode, useContext } from "react";

type TSearchResultsContext = UseQueryResult<TSearchThesesResult> & {
  bulkDownload: () => Promise<TSearchThesesResult>;
};

const LONG_STALE_TIME = 60 * 1000;
const SearchResultsContext = createContext<TSearchResultsContext | null>(null);

export const SearchResultsProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const isSearchResultsPath = pathname.startsWith("/search");

  const [query] = useQueryState("q", searchLikePageParams.q);
  const [languages] = useQueryState(
    "languages",
    searchLikePageParams["languages"]
  );
  const [universities] = useQueryState(
    "universities",
    searchLikePageParams["universities"]
  );
  const [thesisTypes] = useQueryState(
    "thesis_types",
    searchLikePageParams["thesis_types"]
  );
  const [offset] = useQueryState("offset", searchLikePageParams["offset"]);

  const queryKey = getSearchThesesQueryKey({
    query,
    languages,
    universities,
    thesisTypes,
    limit: LIMIT_DEFAULT,
    offset,
  });

  const searchThesesQuery = useQuery({
    queryFn: () =>
      searchTheses({
        query,
        languages,
        universities,
        thesisTypes,
        client: meili,
        limit: LIMIT_DEFAULT,
        offset,
      }),
    queryKey,
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
          limit: LIMIT_BULK,
          offset,
        }),
      queryKey: getSearchThesesQueryKey({
        query,
        languages,
        universities,
        thesisTypes,
        limit: LIMIT_BULK,
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

export default SearchResultsProvider;
