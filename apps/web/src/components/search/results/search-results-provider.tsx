"use client";

import {
  getSearchThesesQueryKey,
  HITS_PER_PAGE_BULK,
  HITS_PER_PAGE_DEFAULT,
  PAGE_DEFAULT,
  PAGE_MAX,
  searchLikePageParamKeys,
  searchLikePageParamParsers,
  searchRoute,
} from "@/components/search/constants";
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
  hasLast: boolean;
  prevPage: number | undefined;
  nextPage: number | undefined;
  currentPage: number;
  hasMultiplePages: boolean | undefined;
};

const LONG_STALE_TIME = 60 * 1000;
const SearchResultsContext = createContext<TSearchResultsContext | null>(null);

export const SearchResultsProvider: React.FC<{
  initialData?: TSearchThesesResult;
  children: ReactNode;
}> = ({ children }) => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const isSearchResultsPath = pathname.startsWith(searchRoute);

  const [query] = useQueryState("q", searchLikePageParamParsers.q);
  const [languages] = useQueryState(
    searchLikePageParamKeys.languages,
    searchLikePageParamParsers.languages
  );
  const [universities] = useQueryState(
    searchLikePageParamKeys.universities,
    searchLikePageParamParsers.universities
  );
  const [departments] = useQueryState(
    searchLikePageParamKeys.departments,
    searchLikePageParamParsers.departments
  );
  const [advisors] = useQueryState(
    searchLikePageParamKeys.advisors,
    searchLikePageParamParsers.advisors
  );
  const [authors] = useQueryState(
    searchLikePageParamKeys.authors,
    searchLikePageParamParsers.authors
  );
  const [thesisTypes] = useQueryState(
    searchLikePageParamKeys.thesis_types,
    searchLikePageParamParsers.thesis_types
  );
  const [yearLte] = useQueryState(
    searchLikePageParamKeys.year_lte,
    searchLikePageParamParsers.year_lte
  );
  const [yearGte] = useQueryState(
    searchLikePageParamKeys.year_gte,
    searchLikePageParamParsers.year_gte
  );
  const [subjects] = useQueryState(
    searchLikePageParamKeys.subjects,
    searchLikePageParamParsers.subjects
  );
  const [searchOn] = useQueryState(
    searchLikePageParamKeys.search_on,
    searchLikePageParamParsers.search_on
  );
  const [page, setPage] = useQueryState(
    searchLikePageParamKeys.page,
    searchLikePageParamParsers.page
  );

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
    searchOn,
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
    subjects,
    search_on: searchOn,
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
        subjects,
        year_gte: yearGte,
        year_lte: yearLte,
        sort: undefined,
        hits_per_page: HITS_PER_PAGE_DEFAULT,
        page: page,
        search_on: searchOn,
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
      subjects,
      search_on: searchOn,
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
  const maxPage =
    totalPages === undefined ? undefined : Math.min(totalPages, PAGE_MAX);

  const hasPrev = totalPages !== undefined ? page > 1 : false;
  const hasNext =
    page <= 0
      ? true
      : maxPage !== undefined
      ? page < maxPage && maxPage > 1
      : false;
  const hasLast =
    hasNext && totalPages !== undefined && totalPages <= PAGE_MAX;

  const prevPage =
    hasPrev && totalPages !== undefined
      ? Math.min(Math.max(totalPages, 1), page - 1)
      : undefined;
  const nextPage =
    page <= 0
      ? 1
      : hasNext && maxPage !== undefined
      ? Math.min(Math.max(maxPage, 1), Math.max(1, page + 1))
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

  const hasMultiplePages =
    totalPages === undefined ? undefined : totalPages > 1;

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
        hasLast,
        prevPage,
        nextPage,
        currentPage: page,
        hasMultiplePages,
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
