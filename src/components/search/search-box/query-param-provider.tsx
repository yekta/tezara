"use client";

import {
  searchLikePageParamKeys,
  searchLikePageParamParsers,
  TSearchLikePageParamParsers,
  type TSearchLikePageParamKeys,
} from "@/components/search/constants";
import { useQueryState } from "nuqs";
import React, { createContext, ReactNode, useContext, useMemo } from "react";

function createSearchLikePageContext<K extends TSearchLikePageParamKeys>() {
  return createContext<GetContextValueType<K> | null>(null);
}

const contexts = Object.fromEntries(
  (Object.keys(searchLikePageParamKeys) as TSearchLikePageParamKeys[]).map(
    (key) => [key, createSearchLikePageContext<typeof key>()]
  )
) as {
  [K in TSearchLikePageParamKeys]: React.Context<GetContextValueType<K> | null>;
};

const providers = Object.fromEntries(
  (Object.keys(searchLikePageParamKeys) as TSearchLikePageParamKeys[]).map(
    <K extends TSearchLikePageParamKeys>(key: K) => {
      const Context = contexts[key];

      const Provider: React.FC<{ children: React.ReactNode }> = ({
        children,
      }) => {
        const [value, setValue] = useQueryState(
          searchLikePageParamKeys[key],
          searchLikePageParamParsers[key]
        );

        const contextValue = useMemo<GetContextValueType<K>>(
          // @ts-expect-error - this is a hack
          () => [value, setValue],
          [value, setValue]
        );

        return (
          <Context.Provider value={contextValue}>{children}</Context.Provider>
        );
      };

      return [key, Provider];
    }
  )
) as {
  [K in TSearchLikePageParamKeys]: React.FC<{ children: ReactNode }>;
};

const hooks = Object.fromEntries(
  (Object.keys(searchLikePageParamKeys) as TSearchLikePageParamKeys[]).map(
    <K extends TSearchLikePageParamKeys>(key: K) => {
      const Context = contexts[key];
      const useHook = () => {
        const context = useContext(Context);
        if (!context) {
          throw new Error(
            `SearchLikePageQueryParamsProvider needs to wrap "${key}" hook for it to work.`
          );
        }
        return context;
      };
      return [key, useHook];
    }
  )
) as {
  [K in TSearchLikePageParamKeys]: () => GetContextValueType<K>;
};

export function SearchLikePageQueryParamsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    Object.values(providers) as React.FC<{ children: ReactNode }>[]
  ).reduce((acc, Provider) => <Provider>{acc}</Provider>, children);
}

export const useSearchLikePageParam = hooks;

type GetValueType<K extends TSearchLikePageParamKeys> =
  TSearchLikePageParamParsers[K];

type GetSetterType<K extends TSearchLikePageParamKeys> = (
  p:
    | TSearchLikePageParamParsers[K]
    | ((value: TSearchLikePageParamParsers[K]) => void)
) => void;

type GetContextValueType<K extends TSearchLikePageParamKeys> = [
  GetValueType<K>,
  GetSetterType<K>
];
