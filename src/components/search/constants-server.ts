import { OFFSET_DEFAULT } from "@/components/search/constants";
import {
  createLoader,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const searchLikePageParams = {
  q: parseAsString.withDefault(""),
  languages: parseAsArrayOf(parseAsString).withDefault([]),
  universities: parseAsArrayOf(parseAsString).withDefault([]),
  thesis_types: parseAsArrayOf(parseAsString).withDefault([]),
  advanced: parseAsBoolean.withDefault(false),
  offset: parseAsInteger.withDefault(OFFSET_DEFAULT),
} as const;

export const loadSearchParams = createLoader(searchLikePageParams);
