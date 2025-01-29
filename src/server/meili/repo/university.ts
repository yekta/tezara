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
}: {
  q: string;
  client: MeiliSearch;
}) {
  const index = client.index<TUniversity>(indexName);
  const result = await index.search(q, {
    page: 1,
    hitsPerPage: 500,
    sort: ["name:asc"],
    attributesToRetrieve: ["name"],
    attributesToSearchOn: ["name"],
  });

  return result;
}

export type TGetUniversitiesResult = Awaited<
  ReturnType<typeof getUniversities>
>;
