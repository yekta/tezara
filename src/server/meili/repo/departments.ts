import { PAGE_DEFAULT } from "@/components/search/constants";
import { boostedStringSort } from "@/server/meili/helpers";
import { TAdvisor } from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "departments";

export async function searchDepartments({
  q,
  page = PAGE_DEFAULT,
  sort = ["name:asc"],
  client,
}: {
  q: string;
  page: number;
  sort: string[] | undefined;
  client: MeiliSearch;
}) {
  const index = client.index<TAdvisor>(indexName);

  const result = await index.search(q, {
    page,
    hitsPerPage: 50,
    sort,
  });
  result.hits = result.hits.sort(
    boostedStringSort({
      field: "name",
      hinder: [],
    })
  );
  return result;
}

export type TSearchDepartmentsResult = Awaited<
  ReturnType<typeof searchDepartments>
>;
