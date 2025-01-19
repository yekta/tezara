import { ParserMap } from "nuqs";

export const OFFSET_DEFAULT = 0;
export const LIMIT_DEFAULT = 50;
export const LIMIT_BULK = 20_000;

type TParams =
  | "q"
  | "languages"
  | "universities"
  | "thesis_types"
  | "advanced"
  | "offset";
export type TSearchLikePageParams = Record<TParams, ParserMap>;
