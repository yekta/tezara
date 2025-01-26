"use client";

import { universitiesPageParams } from "@/app/universities/constants/client";
import { TSearchThesesResult } from "@/server/meili/repo/thesis";
import { AppRouterOutputs, AppRouterQueryResult } from "@/server/trpc/api/root";
import { api } from "@/server/trpc/setup/react";
import { useQueryState } from "nuqs";
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
  const [page, setPage] = useQueryState("page", universitiesPageParams["page"]);

  const query = api.main.getUniversities.useQuery(
    {
      page,
    },
    {
      placeholderData: (prev) => prev,
    }
  );

  const totalPages = query.data?.maxPage;
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
    <UniversitiesPageContext.Provider
      value={{
        ...query,
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
