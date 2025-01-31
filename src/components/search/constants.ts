import { TThesis } from "@/server/meili/types";

export const PAGE_DEFAULT = 1;
export const HITS_PER_PAGE_DEFAULT = 20;
export const HITS_PER_PAGE_BULK = 15_000;

import {
  createSearchParamsCache,
  parseAsArrayOf as parseAsArrayOfServer,
  parseAsBoolean as parseAsBooleanServer,
  parseAsInteger as parseAsIntegerServer,
  parseAsString as parseAsStringServer,
  parseAsStringEnum as parseAsStringEnumServer,
} from "nuqs/server";

import {
  inferParserType,
  parseAsArrayOf as parseAsArrayOfClient,
  parseAsBoolean as parseAsBooleanClient,
  parseAsInteger as parseAsIntegerClient,
  parseAsString as parseAsStringClient,
  parseAsStringEnum as parseAsStringEnumClient,
} from "nuqs";
import { z } from "zod";

export const searchRoute = "/search";

export const AttributesToSearchOnEnum = z.enum([
  "title",
  "abstract",
  "subjects",
  "keywords",
  "author",
  "advisors",
]);

export type TAttributesToSearchOn = z.infer<typeof AttributesToSearchOnEnum>;

const isServer = typeof window === "undefined";
const parseAsArrayOf = isServer ? parseAsArrayOfServer : parseAsArrayOfClient;
const parseAsBoolean = isServer ? parseAsBooleanServer : parseAsBooleanClient;
const parseAsInteger = isServer ? parseAsIntegerServer : parseAsIntegerClient;
const parseAsString = isServer ? parseAsStringServer : parseAsStringClient;
const parseAsStringEnum = isServer
  ? parseAsStringEnumServer
  : parseAsStringEnumClient;

export const searchLikePageParamParsers = {
  q: parseAsString.withDefault(""),
  languages: parseAsArrayOf(parseAsString).withDefault([]),
  universities: parseAsArrayOf(parseAsString).withDefault([]),
  departments: parseAsArrayOf(parseAsString).withDefault([]),
  advisors: parseAsArrayOf(parseAsString).withDefault([]),
  authors: parseAsArrayOf(parseAsString).withDefault([]),
  thesis_types: parseAsArrayOf(parseAsString).withDefault([]),
  subjects: parseAsArrayOf(parseAsString).withDefault([]),
  advanced: parseAsBoolean.withDefault(false),
  page: parseAsInteger.withDefault(PAGE_DEFAULT),
  year_gte: parseAsInteger,
  year_lte: parseAsInteger,
  search_on: parseAsArrayOf(
    parseAsStringEnum(AttributesToSearchOnEnum.options)
  ).withDefault([]),
};

export const cachedSearchLikePageSearchParams = createSearchParamsCache(
  searchLikePageParamParsers
);

export type TSearchLikePageParamParsers = inferParserType<
  typeof searchLikePageParamParsers
>;

export type TSearchLikePageParamKeys = keyof TSearchLikePageParamParsers;

export const searchLikePageParamKeys = Object.fromEntries(
  Object.entries(searchLikePageParamParsers).map(([key]) => [key, key])
) as Record<TSearchLikePageParamKeys, TSearchLikePageParamKeys>;

export type TSearchLikePageParamsSearchProps = Omit<
  TSearchLikePageParamParsers,
  "advanced"
>;

type TGetSearchThesesQueryKeyParams = TSearchLikePageParamsSearchProps & {
  hits_per_page: number | undefined;
  attributes_to_retrieve: (keyof TThesis)[] | undefined;
  attributes_to_not_retrieve: (keyof TThesis)[] | undefined;
};

export function getSearchThesesQueryKey(props: TGetSearchThesesQueryKeyParams) {
  return [
    "searchTheses",
    ...Object.entries(props)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          return undefined;
        }
        if (Array.isArray(value)) {
          return `${key}=${value.sort().join("_")}`;
        }
        return `${key}=${value}`;
      }),
  ];
}
