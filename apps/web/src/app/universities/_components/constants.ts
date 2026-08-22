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

export const universitiesRoute = "/universities";
export const PAGE_DEFAULT = 1;

const isServer = typeof window === "undefined";

const parseAsInteger = isServer ? parseAsIntegerServer : parseAsIntegerClient;
const parseAsString = isServer ? parseAsStringServer : parseAsStringClient;

export const universitiesPageParamParsers = {
  page: parseAsInteger.withDefault(PAGE_DEFAULT),
  q: parseAsString.withDefault(""),
} as const;

export type TUniversitiesPageParamParsers = inferParserType<
  typeof universitiesPageParamParsers
>;

export type TUniversitiesPageParamKeys = keyof TUniversitiesPageParamParsers;

export const universitiesPageParamKeys = Object.fromEntries(
  Object.entries(universitiesPageParamParsers).map(([key]) => [key, key])
) as Record<TUniversitiesPageParamKeys, TUniversitiesPageParamKeys>;

export const cachedUniversitiesPageSearchParams = createSearchParamsCache(
  universitiesPageParamParsers
);
