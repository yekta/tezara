import { meiliAdmin } from "@/server/meili/constants-server";
import { getThesis } from "@/server/meili/repo/thesis";
import { cache } from "react";

export const cachedGetPageData = cache(({ id }: { id: string }) =>
  getPageData({ id })
);

async function getPageData({ id }: { id: string }) {
  const thesis = await getThesis({ id: parseInt(id), client: meiliAdmin });
  return {
    thesis,
  };
}
