"use client";

import {
  TSubjectsPageParamKeys,
  TSubjectsPageParamParsers,
  subjectsPageParamKeys,
  subjectsPageParamParsers,
} from "@/app/subjects/_components/constants";
import { useQueryState } from "nuqs";
import React, { createContext, ReactNode, useContext, useMemo } from "react";

function createSubjectsPageContext<K extends TSubjectsPageParamKeys>() {
  return createContext<GetContextValueType<K> | null>(null);
}

const contexts = Object.fromEntries(
  (Object.keys(subjectsPageParamKeys) as TSubjectsPageParamKeys[]).map(
    (key) => [key, createSubjectsPageContext<typeof key>()]
  )
) as {
  [K in TSubjectsPageParamKeys]: React.Context<GetContextValueType<K> | null>;
};

const providers = Object.fromEntries(
  (Object.keys(subjectsPageParamKeys) as TSubjectsPageParamKeys[]).map(
    <K extends TSubjectsPageParamKeys>(key: K) => {
      const Context = contexts[key];

      const Provider: React.FC<{ children: React.ReactNode }> = ({
        children,
      }) => {
        const [value, setValue] = useQueryState(
          subjectsPageParamKeys[key],
          subjectsPageParamParsers[key]
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
  [K in TSubjectsPageParamKeys]: React.FC<{ children: ReactNode }>;
};

const hooks = Object.fromEntries(
  (Object.keys(subjectsPageParamKeys) as TSubjectsPageParamKeys[]).map(
    <K extends TSubjectsPageParamKeys>(key: K) => {
      const Context = contexts[key];
      const useHook = () => {
        const context = useContext(Context);
        if (!context) {
          throw new Error(
            `SubjectsPageQueryParamProvider needs to wrap "${key}" hook for it to work.`
          );
        }
        return context;
      };
      return [key, useHook];
    }
  )
) as {
  [K in TSubjectsPageParamKeys]: () => GetContextValueType<K>;
};

export function SubjectsPageQueryParamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    Object.values(providers) as React.FC<{ children: ReactNode }>[]
  ).reduce((acc, Provider) => <Provider>{acc}</Provider>, children);
}

export const useSubjectsPageParam = hooks;

type GetValueType<K extends TSubjectsPageParamKeys> =
  TSubjectsPageParamParsers[K];

type GetSetterType<K extends TSubjectsPageParamKeys> = (
  p:
    | TSubjectsPageParamParsers[K]
    | ((value: TSubjectsPageParamParsers[K]) => void)
) => void;

type GetContextValueType<K extends TSubjectsPageParamKeys> = [
  GetValueType<K>,
  GetSetterType<K>
];
