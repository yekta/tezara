import { PAGE_DEFAULT } from "@/components/search/constants/shared";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  type inferParserType,
} from "nuqs";

// DONT FORGET TO ADD EACH VALUE TO server.ts as well
export const searchLikePageParams = {
  q: parseAsString.withDefault(""),
  languages: parseAsArrayOf(parseAsString).withDefault([]),
  universities: parseAsArrayOf(parseAsString).withDefault([]),
  departments: parseAsArrayOf(parseAsString).withDefault([]),
  advisors: parseAsArrayOf(parseAsString).withDefault([]),
  authors: parseAsArrayOf(parseAsString).withDefault([]),
  thesis_types: parseAsArrayOf(parseAsString).withDefault([]),
  advanced: parseAsBoolean.withDefault(false),
  page: parseAsInteger.withDefault(PAGE_DEFAULT),
  year_gte: parseAsInteger,
  year_lte: parseAsInteger,
} as const;

export type TSearchLikePageParams = inferParserType<
  typeof searchLikePageParams
>;
