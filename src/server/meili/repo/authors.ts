import { PAGE_DEFAULT } from "@/components/search/constants/shared";
import { boostedStringSort } from "@/server/meili/helpers";
import { TAuthor } from "@/server/meili/types";
import { MeiliSearch } from "meilisearch";

const indexName = "authors";

export async function searchAuthors({
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
  const index = client.index<TAuthor>(indexName);

  const result = await index.search(q, {
    page,
    hitsPerPage: 50,
    sort,
  });
  result.hits = result.hits.sort(
    boostedStringSort({
      field: "name",
      hinder: [
        (i) => i.startsWith("("),
        (i) => /^\d/.test(i),
        (i) => i.startsWith("<"),
      ],
    })
  );
  return result;
}

export type TSearchAuthorsResult = Awaited<ReturnType<typeof searchAuthors>>;
