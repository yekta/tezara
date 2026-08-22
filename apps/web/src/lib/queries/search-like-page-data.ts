import "server-only";
import { meiliAdmin } from "@/server/meili/constants-server";
import { getLanguages } from "@/server/meili/repo/language";
import { getSubjects } from "@/server/meili/repo/subject";
import { getThesisTypes } from "@/server/meili/repo/thesis-type";
import { getUniversities } from "@/server/meili/repo/university";
import { cacheWithRedis } from "@/server/redis/constants";

export const getSearchLikePageData = cacheWithRedis(
  "getSearchLikePageData",
  _getSearchLikePageData,
  "short"
);

async function _getSearchLikePageData() {
  const [languagesData, universitiesData, thesisTypesData, subjectsData] =
    await Promise.all([
      getLanguages({ client: meiliAdmin }),
      getUniversities({ client: meiliAdmin }),
      getThesisTypes({ client: meiliAdmin }),
      getSubjects({ client: meiliAdmin, languages: ["Turkish"] }),
    ]);
  return { languagesData, universitiesData, thesisTypesData, subjectsData };
}
