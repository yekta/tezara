import {
  parseAsInteger as parseAsIntegerClient,
  parseAsString as parseAsStringClient,
  type inferParserType,
} from "nuqs";
import {
  parseAsInteger as parseAsIntegerServer,
  parseAsString as parseAsStringServer,
} from "nuqs/server";

import { createSearchParamsCache } from "nuqs/server";

export const subjectsRoute = "/subjects";
export const PAGE_DEFAULT = 1;

const isServer = typeof window === "undefined";

const parseAsInteger = isServer ? parseAsIntegerServer : parseAsIntegerClient;
const parseAsString = isServer ? parseAsStringServer : parseAsStringClient;

export const subjectsPageParamParsers = {
  page: parseAsInteger.withDefault(PAGE_DEFAULT),
  q: parseAsString.withDefault(""),
} as const;

export type TSubjectsPageParamParsers = inferParserType<
  typeof subjectsPageParamParsers
>;

export type TSubjectsPageParamKeys = keyof TSubjectsPageParamParsers;

export const subjectsPageParamKeys = Object.fromEntries(
  Object.entries(subjectsPageParamParsers).map(([key]) => [key, key])
) as Record<TSubjectsPageParamKeys, TSubjectsPageParamKeys>;

export const cachedSubjectsPageSearchParams = createSearchParamsCache(
  subjectsPageParamParsers
);
