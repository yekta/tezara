"use client";

import { searchLikePageParams } from "@/components/search/constants/client";
import {
  getSearchThesesQueryKey,
  HITS_PER_PAGE_BULK,
  HITS_PER_PAGE_DEFAULT,
  PAGE_DEFAULT,
} from "@/components/search/constants/shared";
import { useEffectAfterCurrentPageMount } from "@/lib/hooks/use-effect-after-current-page-mount";
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
  prevPage: number | undefined;
  nextPage: number | undefined;
  currentPage: number;
};

const LONG_STALE_TIME = 60 * 1000;
const SearchResultsContext = createContext<TSearchResultsContext | null>(null);

export const SearchResultsProvider: React.FC<{
  initialData?: TSearchThesesResult;
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
  const [yearLte] = useQueryState("year_lte", searchLikePageParams["year_lte"]);
  const [yearGte] = useQueryState("year_gte", searchLikePageParams["year_gte"]);
  const [page, setPage] = useQueryState("page", searchLikePageParams["page"]);

  useEffectAfterCurrentPageMount(() => {
    if (page === PAGE_DEFAULT) return;
    setPage(PAGE_DEFAULT);
  }, [
    query,
    languages,
    universities,
    thesisTypes,
    yearGte,
    yearLte,
    departments,
    advisors,
    authors,
  ]);

  const queryKey = getSearchThesesQueryKey({
    q: query,
    languages,
    universities,
    departments,
    advisors,
    authors,
    thesis_types: thesisTypes,
    year_gte: yearGte,
    year_lte: yearLte,
    hits_per_page: HITS_PER_PAGE_DEFAULT,
    attributes_to_not_retrieve: ["abstract_original", "abstract_translated"],
    attributes_to_retrieve: undefined,
    page: page,
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
        year_gte: yearGte,
        year_lte: yearLte,
        sort: undefined,
        hits_per_page: HITS_PER_PAGE_DEFAULT,
        page: page,
        attributes_to_not_retrieve: [
          "abstract_original",
          "abstract_translated",
        ],
        attributes_to_retrieve: undefined,
        client: meili,
      }),
    queryKey,
    enabled: isSearchResultsPath,
    placeholderData: (prev) => prev,
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
      year_gte: yearGte,
      year_lte: yearLte,
      hits_per_page: HITS_PER_PAGE_BULK,
      attributes_to_not_retrieve: undefined,
      attributes_to_retrieve: undefined,
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

  const hasPrev = totalPages ? page > 1 && totalPages > 1 : false;
  const hasNext =
    page <= 0 ? true : totalPages ? page < totalPages && totalPages > 1 : false;

  const prevPage =
    hasPrev && totalPages ? Math.min(totalPages, page - 1) : undefined;
  const nextPage =
    page <= 0
      ? 1
      : hasNext && totalPages
      ? Math.min(totalPages, Math.max(1, page + 1))
      : undefined;

  const goToPrevPage = () => {
    if (prevPage !== undefined) setPage(prevPage);
  };
  const goToNextPage = () => {
    if (nextPage !== undefined) setPage(nextPage);
  };

  const goToPage = (page: number) => {
    setPage(page);
  };

  const firstPage = 1;
  const lastPage = totalPages || 1;

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
        prevPage,
        nextPage,
        currentPage: page,
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
