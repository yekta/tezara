import { defaultPage } from "@/app/universities/constants/shared";
import { parseAsInteger, type inferParserType } from "nuqs";

// DONT FORGET TO ADD EACH VALUE TO server.ts as well
export const universitiesPageParams = {
  page: parseAsInteger.withDefault(defaultPage),
} as const;

export type TUniversityPageParams = inferParserType<
  typeof universitiesPageParams
>;
