import { boostedStringSort } from "@/server/meili/helpers";
import { TUniversity } from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "universities";

export async function getUniversities({ client }: { client: MeiliSearch }) {
  const index = client.index<TUniversity>(indexName);
  const result = await index.search(undefined, {
    limit: 5000,
    sort: ["name:asc"],
  });

  const hits = [...result.hits];
  hits.sort(
    boostedStringSort({
      hinder: [(v) => v.startsWith("(")],
      field: "name",
    })
  );
  result.hits = hits;

  return result;
}

export async function searchUniversities({
  q,
  client,
  page = 1,
  hits_per_page = 100,
}: {
  q: string;
  client: MeiliSearch;
  page?: number;
  hits_per_page?: number;
}) {
  const index = client.index<TUniversity>(indexName);
  const result = await index.search(q, {
    page,
    hitsPerPage: hits_per_page,
    sort: ["name:asc"],
    attributesToRetrieve: ["name"],
    attributesToSearchOn: ["name"],
  });

  return result;
}

export type TGetUniversitiesResult = Awaited<
  ReturnType<typeof getUniversities>
>;
