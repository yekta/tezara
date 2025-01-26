import { TUniversityPageParams } from "@/app/universities/constants/client";
import { defaultPage } from "@/app/universities/constants/shared";
import { createSearchParamsCache, parseAsInteger } from "nuqs/server";

// DONT FORGET TO ADD EACH VALUE TO client.ts as well
export const universitiesPageParams = {
  page: parseAsInteger.withDefault(defaultPage),
} satisfies Record<keyof TUniversityPageParams, unknown>;

export const cachedUniversitiesPageSearchParams = createSearchParamsCache(
  universitiesPageParams
);
