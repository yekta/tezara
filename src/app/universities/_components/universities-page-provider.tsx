"use client";

import { useUniversitiesPageParam } from "@/app/universities/_components/query-param-provider";
import { PAGE_DEFAULT } from "@/components/search/constants";
import { useEffectAfterCurrentPageMount } from "@/lib/hooks/use-effect-after-current-page-mount";
import { TSearchThesesResult } from "@/server/meili/repo/thesis";
import { AppRouterOutputs, AppRouterQueryResult } from "@/server/trpc/api/root";
import { api } from "@/server/trpc/setup/react";
import React, { createContext, ReactNode, useContext } from "react";

type TUniversitiesPageContext = AppRouterQueryResult<
  AppRouterOutputs["main"]["getUniversities"]
> & {
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

const UniversitiesPageContext = createContext<TUniversitiesPageContext | null>(
  null
);

export const UniversitiesPageProvider: React.FC<{
  initialData?: TSearchThesesResult;
  children: ReactNode;
}> = ({ children }) => {
  const [page, setPage] = useUniversitiesPageParam.page();
  const [query] = useUniversitiesPageParam.q();

  const universitiesQuery = api.main.getUniversities.useQuery(
    {
      page,
      q: query,
    },
    {
      placeholderData: (prev) => prev,
    }
  );

  useEffectAfterCurrentPageMount(() => {
    if (page === PAGE_DEFAULT) return;
    setPage(PAGE_DEFAULT);
  }, [query]);

  const totalPages = universitiesQuery.data?.maxPage;
  const hasPrev = totalPages !== undefined ? page > 1 : false;
  const hasNext =
    page <= 0
      ? true
      : totalPages !== undefined
      ? page < totalPages && totalPages > 1
      : false;

  const prevPage =
    hasPrev && totalPages !== undefined
      ? Math.min(Math.max(totalPages, 1), page - 1)
      : undefined;
  const nextPage =
    page <= 0
      ? 1
      : hasNext && totalPages
      ? Math.min(Math.max(totalPages, 1), Math.max(1, page + 1))
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
    <UniversitiesPageContext.Provider
      value={{
        ...universitiesQuery,
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
    </UniversitiesPageContext.Provider>
  );
};

export const useUniversitiesPage = () => {
  const context = useContext(UniversitiesPageContext);
  if (!context) {
    throw new Error(
      "UniversitiesPageProvider needs to wrap useUniversitiesPage for it to work."
    );
  }
  return context;
};

export default UniversitiesPageProvider;
