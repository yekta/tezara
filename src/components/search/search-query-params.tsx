import { parseAsString, createSearchParamsCache } from "nuqs/server";

export const searchParsers = {
  q: parseAsString.withDefault(""),
};

export const searchPageSearchParamsCache =
  createSearchParamsCache(searchParsers);
