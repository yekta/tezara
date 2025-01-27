import "server-only";

import { meiliAdmin } from "@/server/meili/constants-server";
import { searchAuthors } from "@/server/meili/repo/author";
import { QueryClient } from "@tanstack/react-query";

export const prefetchAuthors = async ({
  queryClient,
}: {
  queryClient: QueryClient;
}) => {
  await queryClient.prefetchQuery({
    queryKey: ["authors", undefined],
    queryFn: () =>
      searchAuthors({
        q: "",
        page: 1,
        sort: undefined,
        client: meiliAdmin,
      }),
  });
};
