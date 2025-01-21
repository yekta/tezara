import type { TSearchLikePageParams } from "@/components/search/constants/client";
import { PAGE_DEFAULT } from "@/components/search/constants/shared";
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

// DONT FORGET TO ADD EACH VALUE TO client.ts as well
export const searchLikePageParams = {
  q: parseAsString.withDefault(""),
  languages: parseAsArrayOf(parseAsString).withDefault([]),
  universities: parseAsArrayOf(parseAsString).withDefault([]),
  advisors: parseAsArrayOf(parseAsString).withDefault([]),
  authors: parseAsArrayOf(parseAsString).withDefault([]),
  thesis_types: parseAsArrayOf(parseAsString).withDefault([]),
  advanced: parseAsBoolean.withDefault(false),
  page: parseAsInteger.withDefault(PAGE_DEFAULT),
  year_gte: parseAsInteger,
  year_lte: parseAsInteger,
} satisfies Record<keyof TSearchLikePageParams, unknown>;

export const cachedSearchLikePageSearchParams =
  createSearchParamsCache(searchLikePageParams);
