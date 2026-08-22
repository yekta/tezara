"use client";

import {
  TUniversitiesPageParamKeys,
  TUniversitiesPageParamParsers,
  universitiesPageParamKeys,
  universitiesPageParamParsers,
} from "@/app/universities/_components/constants";
import { useQueryState } from "nuqs";
import React, { createContext, ReactNode, useContext, useMemo } from "react";

function createUniversitiesPageContext<K extends TUniversitiesPageParamKeys>() {
  return createContext<GetContextValueType<K> | null>(null);
}

const contexts = Object.fromEntries(
  (Object.keys(universitiesPageParamKeys) as TUniversitiesPageParamKeys[]).map(
    (key) => [key, createUniversitiesPageContext<typeof key>()]
  )
) as {
  [K in TUniversitiesPageParamKeys]: React.Context<GetContextValueType<K> | null>;
};

const providers = Object.fromEntries(
  (Object.keys(universitiesPageParamKeys) as TUniversitiesPageParamKeys[]).map(
    <K extends TUniversitiesPageParamKeys>(key: K) => {
      const Context = contexts[key];

      const Provider: React.FC<{ children: React.ReactNode }> = ({
        children,
      }) => {
        const [value, setValue] = useQueryState(
          universitiesPageParamKeys[key],
          universitiesPageParamParsers[key]
        );

        const contextValue = useMemo<GetContextValueType<K>>(
          // @ts-expect-error - this is fine
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
  [K in TUniversitiesPageParamKeys]: React.FC<{ children: ReactNode }>;
};

const hooks = Object.fromEntries(
  (Object.keys(universitiesPageParamKeys) as TUniversitiesPageParamKeys[]).map(
    <K extends TUniversitiesPageParamKeys>(key: K) => {
      const Context = contexts[key];
      const useHook = () => {
        const context = useContext(Context);
        if (!context) {
          throw new Error(
            `UniversitiesPageQueryParamProvider needs to wrap "${key}" hook for it to work.`
          );
        }
        return context;
      };
      return [key, useHook];
    }
  )
) as {
  [K in TUniversitiesPageParamKeys]: () => GetContextValueType<K>;
};

export function UniversitiesPageQueryParamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    Object.values(providers) as React.FC<{ children: ReactNode }>[]
  ).reduce((acc, Provider) => <Provider>{acc}</Provider>, children);
}

export const useUniversitiesPageParam = hooks;

type GetValueType<K extends TUniversitiesPageParamKeys> =
  TUniversitiesPageParamParsers[K];

type GetSetterType<K extends TUniversitiesPageParamKeys> = (
  p:
    | TUniversitiesPageParamParsers[K]
    | ((value: TUniversitiesPageParamParsers[K]) => void)
) => void;

type GetContextValueType<K extends TUniversitiesPageParamKeys> = [
  GetValueType<K>,
  GetSetterType<K>
];
