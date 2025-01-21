import { TSearchLikePageParams } from "@/components/search/constants/client";
import { TThesisExtended } from "@/server/meili/types";

export const PAGE_DEFAULT = 1;
export const HITS_PER_PAGE_DEFAULT = 20;
export const HITS_PER_PAGE_BULK = 15_000;

export type TSearchLikePageParamsSearchProps = Omit<
  TSearchLikePageParams,
  "advanced"
>;

type TGetSearchThesesQueryKeyParams = TSearchLikePageParamsSearchProps & {
  hits_per_page: number | undefined;
  attributes_to_retrieve: (keyof TThesisExtended)[] | undefined;
  attributes_to_not_retrieve: (keyof TThesisExtended)[] | undefined;
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
