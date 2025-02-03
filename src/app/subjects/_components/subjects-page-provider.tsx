"use client";

import { useSubjectsPageParam } from "@/app/subjects/_components/query-param-provider";
import { PAGE_DEFAULT } from "@/components/search/constants";
import { useEffectAfterCurrentPageMount } from "@/lib/hooks/use-effect-after-current-page-mount";
import { TSearchThesesResult } from "@/server/meili/repo/thesis";
import { AppRouterOutputs, AppRouterQueryResult } from "@/server/trpc/api/root";
import { api } from "@/server/trpc/setup/react";
import React, { createContext, ReactNode, useContext } from "react";

type TSubjectsPageContext = AppRouterQueryResult<
  AppRouterOutputs["main"]["getSubjects"]
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
  hasMultiplePages: boolean | undefined;
};

const SubjectsPageContext = createContext<TSubjectsPageContext | null>(null);

export const SubjectsPageProvider: React.FC<{
  initialData?: TSearchThesesResult;
  children: ReactNode;
}> = ({ children }) => {
  const [page, setPage] = useSubjectsPageParam.page();
  const [query] = useSubjectsPageParam.q();

  const subjectsQuery = api.main.getSubjects.useQuery(
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

  const totalPages = subjectsQuery.data?.maxPage;
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

  const hasMultiplePages =
    totalPages === undefined ? undefined : totalPages > 1;

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
    <SubjectsPageContext.Provider
      value={{
        ...subjectsQuery,
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
        hasMultiplePages,
      }}
    >
      {children}
    </SubjectsPageContext.Provider>
  );
};

export const useSubjectsPage = () => {
  const context = useContext(SubjectsPageContext);
  if (!context) {
    throw new Error(
      "SubjectsPageProvider needs to wrap useSubjectsPage for it to work."
    );
  }
  return context;
};

export default SubjectsPageProvider;
