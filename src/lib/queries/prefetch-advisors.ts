import "server-only";

import { meiliAdmin } from "@/server/meili/constants-server";
import { searchAdvisors } from "@/server/meili/repo/advisors";
import { QueryClient } from "@tanstack/react-query";

export const prefetchAdvisors = async ({
  queryClient,
}: {
  queryClient: QueryClient;
}) => {
  await queryClient.prefetchQuery({
    queryKey: ["advisors", undefined],
    queryFn: () =>
      searchAdvisors({
        q: "",
        page: 1,
        sort: undefined,
        client: meiliAdmin,
      }),
  });
};
