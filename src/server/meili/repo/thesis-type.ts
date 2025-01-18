import { boostedStringSort } from "@/server/meili/helpers";
import { TThesisType } from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "thesis_types";

export async function getThesisTypes({ client }: { client: MeiliSearch }) {
  const index = client.index<TThesisType>(indexName);
  const result = await index.search(undefined, {
    limit: 5000,
    sort: ["name:asc"],
  });

  const hits = [...result.hits];
  hits.sort(
    boostedStringSort({
      boost: [
        "Yüksek Lisans",
        "Doktora",
        "Sanatta Yeterlik",
        "Tıpta Uzmanlık",
        "Tıpta Yan Dal Uzmanlık",
      ],
      field: "name",
    })
  );
  result.hits = hits;

  return result;
}

export type TGetThesisTypesResult = Awaited<ReturnType<typeof getThesisTypes>>;
