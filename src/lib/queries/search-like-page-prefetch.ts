import { prefetchAdvisors } from "@/lib/queries/prefetch-advisors";
import { prefetchAuthors } from "@/lib/queries/prefetch-authors";
import { prefetchDepartments } from "@/lib/queries/prefetch-departments";
import { QueryClient } from "@tanstack/react-query";

export const getSearchLikePagePrefetchPromises = ({
  queryClient,
}: {
  queryClient: QueryClient;
}) => [
  prefetchAdvisors({ queryClient }),
  prefetchAuthors({ queryClient }),
  prefetchDepartments({ queryClient }),
];
