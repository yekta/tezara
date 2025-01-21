import "server-only";

import { meiliAdmin } from "@/server/meili/constants-server";
import { searchDepartments } from "@/server/meili/repo/departments";
import { QueryClient } from "@tanstack/react-query";

export const prefetchDepartments = async ({
  queryClient,
}: {
  queryClient: QueryClient;
}) => {
  await queryClient.prefetchQuery({
    queryKey: ["departments", undefined],
    queryFn: () =>
      searchDepartments({
        q: "",
        page: 1,
        sort: undefined,
        client: meiliAdmin,
      }),
  });
};
