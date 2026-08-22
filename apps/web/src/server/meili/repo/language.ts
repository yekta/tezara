import { boostedStringSort } from "@/server/meili/helpers";
import { TLanguage } from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "languages";

export async function getLanguages({ client }: { client: MeiliSearch }) {
  const index = client.index<TLanguage>(indexName);
  const result = await index.search(undefined, {
    limit: 5000,
    sort: ["name:asc"],
  });

  const hits = [...result.hits];
  hits.sort(
    boostedStringSort({
      boost: ["Türkçe", "İngilizce", "Arapça"],
      field: "name",
    })
  );
  result.hits = hits;

  return result;
}

export type TGetLanguagesResult = Awaited<ReturnType<typeof getLanguages>>;
