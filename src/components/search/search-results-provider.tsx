"use client";

import { searchLikePageParams } from "@/components/search/constants/client";
import {
  HITS_PER_PAGE_BULK,
  HITS_PER_PAGE_DEFAULT,
  PAGE_DEFAULT,
} from "@/components/search/constants/shared";
import { getSearchThesesQueryKey } from "@/components/search/helpers";
import { useEffectAfterMount } from "@/lib/hooks/use-effect-after-mount";
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
  goToNextPage: () => void;
  goToPrevPage: () => void;
  goToPage: (page: number) => void;
  firstPage: number;
  lastPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  currentPage: number;
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
  const [departments] = useQueryState(
    "departments",
    searchLikePageParams["departments"]
  );
  const [advisors] = useQueryState(
    "advisors",
    searchLikePageParams["advisors"]
  );
  const [authors] = useQueryState("authors", searchLikePageParams["advisors"]);
  const [thesisTypes] = useQueryState(
    "thesis_types",
    searchLikePageParams["thesis_types"]
  );
  const [yearLteQP] = useQueryState(
    "year_lte",
    searchLikePageParams["year_lte"]
  );
  const [yearGteQP] = useQueryState(
    "year_gte",
    searchLikePageParams["year_gte"]
  );
  const [pageQP, setPageQP] = useQueryState(
    "page",
    searchLikePageParams["page"]
  );

  const queryKey = getSearchThesesQueryKey({
    q: query,
    languages,
    universities,
    departments,
    advisors,
    authors,
    thesis_types: thesisTypes,
    year_gte: yearGteQP,
    year_lte: yearLteQP,
    hits_per_page: HITS_PER_PAGE_DEFAULT,
    page: pageQP,
  });

  const searchThesesQuery = useQuery({
    queryFn: () =>
      searchTheses({
        q: query,
        languages,
        universities,
        departments,
        advisors,
        authors,
        thesis_types: thesisTypes,
        year_gte: yearGteQP,
        year_lte: yearLteQP,
        sort: undefined,
        hits_per_page: HITS_PER_PAGE_DEFAULT,
        page: pageQP,
        client: meili,
      }),
    queryKey,
    enabled: isSearchResultsPath,
  });

  const bulkDownload: TSearchResultsContext["bulkDownload"] = async () => {
    const params: Parameters<typeof getSearchThesesQueryKey>[0] = {
      q: query,
      languages,
      universities,
      departments,
      advisors,
      authors,
      thesis_types: thesisTypes,
      year_gte: yearGteQP,
      year_lte: yearLteQP,
      hits_per_page: HITS_PER_PAGE_BULK,
      page: PAGE_DEFAULT,
    };

    return queryClient.fetchQuery({
      queryFn: () =>
        searchTheses({
          ...params,
          sort: undefined,
          client: meili,
        }),
      queryKey: getSearchThesesQueryKey({
        ...params,
      }),
      staleTime: LONG_STALE_TIME,
    });
  };

  const totalPages = searchThesesQuery.data?.totalPages;
  const hasNext = totalPages ? pageQP < totalPages && totalPages > 1 : false;
  const hasPrev = pageQP > 1 && totalPages !== undefined && totalPages > 1;

  const goToNextPage = () => {
    if (!hasNext) return;
    if (!totalPages) return;
    const adjustedPage = Math.min(totalPages, pageQP + 1);
    setPageQP(adjustedPage);
  };

  const goToPrevPage = () => {
    if (!hasPrev) return;
    if (!totalPages) return;
    const adjustedPage = Math.min(totalPages, Math.max(1, pageQP - 1));
    setPageQP(adjustedPage);
  };

  const goToPage = (page: number) => {
    setPageQP(page);
  };

  const firstPage = 1;
  const lastPage = totalPages || 1;

  useEffectAfterMount(() => {
    if (pageQP === PAGE_DEFAULT) return;
    setPageQP(PAGE_DEFAULT);
  }, [query, languages, universities, thesisTypes, yearGteQP, yearLteQP]);

  return (
    <SearchResultsContext.Provider
      value={{
        ...searchThesesQuery,
        bulkDownload,
        goToNextPage,
        goToPrevPage,
        goToPage,
        firstPage,
        lastPage,
        hasNext,
        hasPrev,
        currentPage: pageQP,
      }}
    >
      {children}
    </SearchResultsContext.Provider>
  );
};

export const useSearchResults = () => {
  const context = useContext(SearchResultsContext);
  return context;
};

export default SearchResultsProvider;
